import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateQuote } from "@/lib/services/priceCalculator";
import { normalizeKenyanPhone } from "@/lib/phone";

const sidesSchema = z.enum(["SINGLE", "DOUBLE"]).optional();
const itemSchema = z.object({
  paperTypeId: z.string().optional(),
  finishingServiceId: z.string().optional(),
  description: z.string().optional(),
  sides: sidesSchema,
  quantity: z.number().positive(),
  customUnitPrice: z.number().nonnegative().optional(),
});

const jobSchema = z.object({
  orderType: z.enum(["QUOTATION", "ORDER"]).default("QUOTATION"),
  client: z.object({ name: z.string().min(2), phone: z.string().min(7), email: z.string().email().optional().or(z.literal("")), address: z.string().optional() }),
  items: z.array(itemSchema).min(1),
  discountAmount: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function GET() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const jobs = await prisma.jobOrder.findMany({ where: { tenantId: tenant.id }, include: { client: true, items: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(jobs.map((job) => ({
    ...job,
    subtotal: Number(job.subtotal),
    discountAmount: Number(job.discountAmount),
    vatRate: Number(job.vatRate),
    vatAmount: Number(job.vatAmount),
    totalAmount: Number(job.totalAmount),
    amountPaid: Number(job.amountPaid),
    balanceDue: Number(job.balanceDue),
    items: job.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
  })));
}

export async function POST(request: Request) {
  const payload = jobSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid job order" }, { status: 400 });
  const input = payload.data;
  input.client.phone = normalizeKenyanPhone(input.client.phone);
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const [paperTypes, finishingServices] = await Promise.all([
    prisma.paperType.findMany({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.finishingService.findMany({ where: { tenantId: tenant.id, isActive: true } }),
  ]);
  const quote = calculateQuote({ lines: input.items, discountAmount: input.discountAmount, vatRate: input.vatRate }, {
    paperTypes: paperTypes.map((item) => ({ id: item.id, name: item.name, singleSidePrice: Number(item.singleSidePrice), doubleSidePrice: item.doubleSidePrice === null ? null : Number(item.doubleSidePrice), isActive: item.isActive })),
    finishingServices: finishingServices.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), doubleSidePrice: item.doubleSidePrice === null ? null : Number(item.doubleSidePrice), isActive: item.isActive })),
  });

  const job = await prisma.$transaction(async (tx) => {
    const client = await tx.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: input.client.phone } },
      update: { name: input.client.name, email: input.client.email || null, address: input.client.address || null },
      create: { tenantId: tenant.id, name: input.client.name, phone: input.client.phone, email: input.client.email || null, address: input.client.address || null },
    });
    const counter = await tx.jobOrderCounter.update({ where: { tenantId: tenant.id }, data: { lastNumber: { increment: 1 } } });
    const jobNumber = `POMS-${tenant.jobPrefix}-${counter.lastNumber}`;
    const createdJob = await tx.jobOrder.create({
      data: {
        tenantId: tenant.id,
        jobNumber,
        clientId: client.id,
        status: input.orderType === "ORDER" ? "IN_PRODUCTION" : "QUOTATION",
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        totalAmount: quote.totalAmount,
        balanceDue: quote.totalAmount,
        notes: input.notes,
        items: { create: quote.lines.map((line, index) => ({ paperTypeId: line.paperTypeId, finishingServiceId: line.finishingServiceId, description: line.description, sides: line.sides, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.lineTotal, sortOrder: index })) },
      },
      include: { client: true, items: true },
    });
    if (input.orderType === "ORDER") {
      for (const item of createdJob.items) {
        if (!item.paperTypeId) continue;
        const inventory = await tx.inventoryItem.findFirst({ where: { tenantId: tenant.id, paperTypeId: item.paperTypeId } });
        if (!inventory) continue;
        await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityOnHand: { decrement: item.quantity } } });
        await tx.stockMovement.create({ data: { tenantId: tenant.id, inventoryItemId: inventory.id, type: "STOCK_OUT", quantity: item.quantity, reason: `Consumed by ${createdJob.jobNumber}`, jobOrderId: createdJob.id } });
      }
    }
    return createdJob;
  });

  return NextResponse.json(job, { status: 201 });
}
