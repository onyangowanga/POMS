import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const clientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function GET(request: Request) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  const clients = await prisma.client.findMany({
    where: { tenantId: tenant.id, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } : {}) },
    orderBy: { name: "asc" },
    take: 30,
  });
  return NextResponse.json(clients.map((client) => ({ ...client, creditBalance: Number(client.creditBalance) })));
}

export async function POST(request: Request) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const parsed = clientSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid client" }, { status: 400 });
  const client = await prisma.client.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: parsed.data.phone } },
    update: { name: parsed.data.name, email: parsed.data.email || null, address: parsed.data.address || null },
    create: { tenantId: tenant.id, name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null, address: parsed.data.address || null },
  });
  return NextResponse.json({ ...client, creditBalance: Number(client.creditBalance) }, { status: 201 });
}
