import { PrismaClient } from "@prisma/client";
import {
  ALUWOOD_FINISHING_SEED,
  ALUWOOD_PAPER_PRICE_SEED,
  ALUWOOD_TENANT_SEED,
} from "../src/types/poms";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: ALUWOOD_TENANT_SEED.slug },
    update: {},
    create: {
      name: ALUWOOD_TENANT_SEED.name,
      slug: ALUWOOD_TENANT_SEED.slug,
      jobPrefix: ALUWOOD_TENANT_SEED.jobPrefix,
      location: ALUWOOD_TENANT_SEED.location,
      contactPhone: ALUWOOD_TENANT_SEED.contactPhone,
    },
  });

  await prisma.jobOrderCounter.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, lastNumber: 1000 },
  });

  for (const [index, paper] of ALUWOOD_PAPER_PRICE_SEED.entries()) {
    await prisma.paperType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: paper.name } },
      update: {
        category: paper.category,
        gsm: paper.gsm,
        singleSidePrice: paper.singleSidePrice,
        doubleSidePrice: paper.doubleSidePrice,
      },
      create: {
        tenantId: tenant.id,
        name: paper.name,
        category: paper.category,
        gsm: paper.gsm,
        singleSidePrice: paper.singleSidePrice,
        doubleSidePrice: paper.doubleSidePrice,
        sortOrder: index,
      },
    });
  }

  for (const [index, service] of ALUWOOD_FINISHING_SEED.entries()) {
    await prisma.finishingService.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: service.name } },
      update: { price: service.price, doubleSidePrice: service.doubleSidePrice },
      create: {
        tenantId: tenant.id,
        name: service.name,
        price: service.price,
        doubleSidePrice: service.doubleSidePrice,
        sortOrder: index,
      },
    });
  }

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "owner@aluwood.co.ke" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Aluwood Owner",
      email: "owner@aluwood.co.ke",
      phone: ALUWOOD_TENANT_SEED.contactPhone,
      // Placeholder only — replace with a real bcrypt hash once auth is wired up.
      passwordHash: "CHANGE_ME",
      role: "OWNER",
    },
  });

  console.log(`Seeded tenant "${tenant.name}" (${tenant.id}) with owner user ${owner.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
