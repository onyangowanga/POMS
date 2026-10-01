import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({ status: z.enum(["QUOTATION", "PENDING_DEPOSIT", "IN_PRODUCTION", "READY_FOR_COLLECTION", "DELIVERED", "COMPLETED", "CANCELLED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const role = request.headers.get("x-poms-role");
  if (!role || !["OWNER", "PRODUCTION", "WORKER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  const { id } = await context.params;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid job status" }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    const job = await tx.jobOrder.findUniqueOrThrow({ where: { id }, include: { items: true } });
    if (job.status !== "IN_PRODUCTION" && parsed.data.status === "IN_PRODUCTION") {
      for (const item of job.items) {
        if (!item.paperTypeId) continue;
        const inventory = await tx.inventoryItem.findFirst({ where: { tenantId: job.tenantId, paperTypeId: item.paperTypeId } });
        if (!inventory) continue;
        await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityOnHand: { decrement: item.quantity } } });
        await tx.stockMovement.create({ data: { tenantId: job.tenantId, inventoryItemId: inventory.id, type: "STOCK_OUT", quantity: item.quantity, reason: `Consumed by ${job.jobNumber}`, jobOrderId: job.id } });
      }
    }
    return tx.jobOrder.update({ where: { id }, data: { status: parsed.data.status } });
  });

  return NextResponse.json(updated);
}
