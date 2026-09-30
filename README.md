# POMS — Printers Operations Management System

Multi-tenant SaaS for commercial digital print shops: serialized job orders,
production tracking, inventory/consumables, staff, financial ledgers, and
automated client messaging (SMS / WhatsApp). First tenant: **Aluwood
Enterprises** (Ndaragwa House, Mezzanine Floor MF24 · 0720115999).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (Supabase-compatible)
- Zod for input validation

## Project layout

```
prisma/schema.prisma        Multi-tenant DB schema (Tenants, Users, Clients,
                             PaperType/FinishingService price matrix,
                             Inventory, JobOrders, OrderItems, Transactions,
                             Notifications, ActivityLog)
prisma/seed.ts               Seeds the Aluwood Enterprises tenant + price list
src/types/poms.ts            Shared domain types + Aluwood pricing seed data
src/lib/services/priceCalculator.ts   Pure pricing engine (paper/finishing → quote)
src/lib/prisma.ts             Prisma client singleton
src/lib/sample-data.ts        In-memory demo fixtures (used until DB is wired up)
src/app/dashboard/...         Owner dashboard, job order list/detail/new, price list,
                               clients, inventory, staff
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the dashboard at `/dashboard` runs entirely on
in-memory demo data (`src/lib/sample-data.ts`), so it works without a database.

### Connecting a real database

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres
   instance (Supabase, Neon, RDS, or local Postgres).
2. Run the migration and seed:

   ```bash
   npm run db:migrate   # creates tables from prisma/schema.prisma
   npm run db:seed      # seeds the Aluwood Enterprises tenant + price matrix
   npm run db:studio    # optional: browse data in Prisma Studio
   ```
3. Swap the reads in `src/app/dashboard/**` from `src/lib/sample-data.ts` to
   Prisma queries (`src/lib/prisma.ts`) as each screen is wired up.

## What's implemented so far

- Database schema for the full workflow (Quotation → Pending Deposit → In
  Production → Ready for Collection → Delivered → Completed).
- Aluwood Enterprises price matrix seeded exactly as specified (paper types,
  Bond A3/A4, Sticker, Ivory, Own Paper, Lamination finishing).
- Pricing engine (`calculateQuote`) used by the New Job Order screen for live
  line-item + VAT totals.
- Dashboard: revenue/receivables/low-stock stats, job status pipeline, job
  list, job detail with financial ledger, price list, clients, inventory,
  staff placeholder screens.

## Not yet implemented (next steps)

- Authentication & role-based access control (Owner/Admin/Accountant/Production/Worker).
- API routes / server actions that persist Job Orders, Transactions, and Stock
  Movements through Prisma (currently the New Job Order screen is a client-side
  preview only).
- SMS / WhatsApp notification gateway integration (Africa's Talking / Twilio /
  WhatsApp Business API) — the job detail page has placeholder, disabled
  notification buttons marking where this plugs in.
- PDF quotation/invoice generation.
- Serialized job number generation service backed by `JobOrderCounter`
  (schema is in place; needs a transactional increment function + API route).
