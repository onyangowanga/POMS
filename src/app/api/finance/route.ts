import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const entrySchema = z.object({
  kind: z.enum(["purchase", "expense"]),
  description: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().positive(),
  method: z.enum(["CASH", "MPESA", "BANK", "CARD", "OTHER"]).default("CASH"),
  date: z.string().optional(),
  supplier: z.string().optional(),
});

function startOf(period: string) {
  const now = new Date();
  if (period === "daily") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "weekly") {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET(request: Request) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const period = new URL(request.url).searchParams.get("period") ?? "monthly";
  const from = startOf(period);
  const [orders, purchases, expenses] = await Promise.all([
    prisma.jobOrder.findMany({ where: { tenantId: tenant.id, createdAt: { gte: from } }, select: { totalAmount: true, amountPaid: true } }),
    prisma.purchase.findMany({ where: { tenantId: tenant.id, purchaseDate: { gte: from } }, orderBy: { purchaseDate: "desc" } }),
    prisma.expense.findMany({ where: { tenantId: tenant.id, expenseDate: { gte: from } }, orderBy: { expenseDate: "desc" } }),
  ]);
  const sales = orders.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const collected = orders.reduce((sum, item) => sum + Number(item.amountPaid), 0);
  const purchaseTotal = purchases.reduce((sum, item) => sum + Number(item.amount), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  return NextResponse.json({ period, from, sales, collected, purchases: purchaseTotal, expenses: expenseTotal, grossRevenue: sales - purchaseTotal - expenseTotal, purchaseEntries: purchases, expenseEntries: expenses });
}

export async function POST(request: Request) {
  if (request.headers.get("x-poms-role") !== "OWNER") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const parsed = entrySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid finance entry" }, { status: 400 });
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
  if (parsed.data.kind === "purchase") {
    const entry = await prisma.purchase.create({ data: { tenantId: tenant.id, supplier: parsed.data.supplier, description: parsed.data.description, category: parsed.data.category, amount: parsed.data.amount, method: parsed.data.method, purchaseDate: date } });
    return NextResponse.json(entry, { status: 201 });
  }
  const entry = await prisma.expense.create({ data: { tenantId: tenant.id, description: parsed.data.description, category: parsed.data.category, amount: parsed.data.amount, method: parsed.data.method, expenseDate: date } });
  return NextResponse.json(entry, { status: 201 });
}
