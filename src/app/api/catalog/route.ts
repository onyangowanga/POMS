import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paperSchema = z.object({
  kind: z.literal("paper"),
  id: z.string().optional(),
  name: z.string().min(2),
  singleSidePrice: z.number().nonnegative(),
  doubleSidePrice: z.number().nonnegative().nullable(),
  category: z.string().optional(),
  gsm: z.number().int().positive().nullable().optional(),
});

const serviceSchema = z.object({
  kind: z.literal("service"),
  id: z.string().optional(),
  name: z.string().min(2),
  price: z.number().nonnegative(),
  doubleSidePrice: z.number().nonnegative().nullable(),
});

const inventorySchema = z.object({
  kind: z.literal("inventory"),
  id: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(["PAPER", "TONER", "INK", "OTHER"]),
  unit: z.string().min(1),
  quantityOnHand: z.number().nonnegative(),
  reorderLevel: z.number().nonnegative(),
  costPerUnit: z.number().nonnegative(),
  paperTypeId: z.string().optional().nullable(),
});

async function getTenant() {
  return prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
}

function ownerOnly(request: Request) {
  return request.headers.get("x-poms-role") === "OWNER";
}

export async function GET() {
  const tenant = await getTenant();
  const [paperTypes, finishingServices, inventory] = await Promise.all([
    prisma.paperType.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.finishingService.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.inventoryItem.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    paperTypes: paperTypes.map((item) => ({ ...item, singleSidePrice: Number(item.singleSidePrice), doubleSidePrice: item.doubleSidePrice === null ? null : Number(item.doubleSidePrice) })),
    finishingServices: finishingServices.map((item) => ({ ...item, price: Number(item.price), doubleSidePrice: item.doubleSidePrice === null ? null : Number(item.doubleSidePrice) })),
    inventory: inventory.map((item) => ({ ...item, quantityOnHand: Number(item.quantityOnHand), reorderLevel: Number(item.reorderLevel), costPerUnit: Number(item.costPerUnit) })),
  });
}

export async function POST(request: Request) {
  if (!ownerOnly(request)) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const payload = await request.json();
  const tenant = await getTenant();

  const parsed = payload.kind === "paper"
    ? paperSchema.safeParse(payload)
    : payload.kind === "service"
      ? serviceSchema.safeParse(payload)
      : inventorySchema.safeParse(payload);

  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (data.kind === "paper") {
    const item = await prisma.paperType.create({ data: { tenantId: tenant.id, name: data.name, category: data.category, gsm: data.gsm, singleSidePrice: data.singleSidePrice, doubleSidePrice: data.doubleSidePrice } });
    return NextResponse.json(item, { status: 201 });
  }
  if (data.kind === "service") {
    const item = await prisma.finishingService.create({ data: { tenantId: tenant.id, name: data.name, price: data.price, doubleSidePrice: data.doubleSidePrice } });
    return NextResponse.json(item, { status: 201 });
  }
  const item = await prisma.inventoryItem.create({ data: { tenantId: tenant.id, name: data.name, type: data.type, unit: data.unit, quantityOnHand: data.quantityOnHand, reorderLevel: data.reorderLevel, costPerUnit: data.costPerUnit, paperTypeId: data.paperTypeId } });
  if (data.quantityOnHand > 0) await prisma.stockMovement.create({ data: { tenantId: tenant.id, inventoryItemId: item.id, type: "STOCK_IN", quantity: data.quantityOnHand, reason: "Opening/manual stock entry" } });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!ownerOnly(request)) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const payload = await request.json();
  const tenant = await getTenant();
  if (!payload.id) return NextResponse.json({ error: "An item id is required" }, { status: 400 });

  if (payload.kind === "paper") {
    const data = paperSchema.parse(payload);
    if (!data.id) return NextResponse.json({ error: "An item id is required" }, { status: 400 });
    await prisma.paperType.findFirstOrThrow({ where: { id: data.id, tenantId: tenant.id } });
    return NextResponse.json(await prisma.paperType.update({ where: { id: data.id }, data: { name: data.name, category: data.category, gsm: data.gsm, singleSidePrice: data.singleSidePrice, doubleSidePrice: data.doubleSidePrice } }));
  }
  if (payload.kind === "service") {
    const data = serviceSchema.parse(payload);
    if (!data.id) return NextResponse.json({ error: "An item id is required" }, { status: 400 });
    await prisma.finishingService.findFirstOrThrow({ where: { id: data.id, tenantId: tenant.id } });
    return NextResponse.json(await prisma.finishingService.update({ where: { id: data.id }, data: { name: data.name, price: data.price, doubleSidePrice: data.doubleSidePrice } }));
  }
  const data = inventorySchema.parse(payload);
  if (!data.id) return NextResponse.json({ error: "An item id is required" }, { status: 400 });
  const existing = await prisma.inventoryItem.findFirstOrThrow({ where: { id: data.id, tenantId: tenant.id } });
  const updated = await prisma.inventoryItem.update({ where: { id: data.id }, data: { name: data.name, type: data.type, unit: data.unit, quantityOnHand: data.quantityOnHand, reorderLevel: data.reorderLevel, costPerUnit: data.costPerUnit, paperTypeId: data.paperTypeId } });
  const difference = data.quantityOnHand - Number(existing.quantityOnHand);
  if (difference !== 0) await prisma.stockMovement.create({ data: { tenantId: tenant.id, inventoryItemId: data.id, type: difference > 0 ? "STOCK_IN" : "ADJUSTMENT", quantity: Math.abs(difference), reason: "Manual inventory adjustment" } });
  return NextResponse.json(updated);
}
