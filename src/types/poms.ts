/**
 * POMS (Printers Operations Management System) — shared domain types.
 *
 * These mirror the Prisma schema (prisma/schema.prisma) but are hand written
 * so the app can use lightweight DTOs in the UI/API layer without importing
 * generated Prisma types everywhere. Keep enums in sync with schema.prisma.
 */

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  ACCOUNTANT: "ACCOUNTANT",
  PRODUCTION: "PRODUCTION",
  WORKER: "WORKER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PricingUnit = {
  PER_SHEET: "PER_SHEET",
  PER_SQFT: "PER_SQFT",
  PER_ITEM: "PER_ITEM",
} as const;
export type PricingUnit = (typeof PricingUnit)[keyof typeof PricingUnit];

export const InventoryType = {
  PAPER: "PAPER",
  TONER: "TONER",
  INK: "INK",
  OTHER: "OTHER",
} as const;
export type InventoryType = (typeof InventoryType)[keyof typeof InventoryType];

export const StockMovementType = {
  STOCK_IN: "STOCK_IN",
  STOCK_OUT: "STOCK_OUT",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

/** Ordered end-to-end job lifecycle. Array order matters for pipeline UIs. */
export const JOB_ORDER_STATUSES = [
  "QUOTATION",
  "PENDING_DEPOSIT",
  "IN_PRODUCTION",
  "READY_FOR_COLLECTION",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type JobOrderStatus = (typeof JOB_ORDER_STATUSES)[number];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const SideOption = {
  SINGLE: "SINGLE",
  DOUBLE: "DOUBLE",
} as const;
export type SideOption = (typeof SideOption)[keyof typeof SideOption];

export const TransactionType = {
  DEPOSIT: "DEPOSIT",
  PAYMENT: "PAYMENT",
  REFUND: "REFUND",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const PaymentMethod = {
  CASH: "CASH",
  MPESA: "MPESA",
  BANK: "BANK",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const NotificationChannel = {
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationType = {
  ORDER_CREATED: "ORDER_CREATED",
  JOB_COMPLETED: "JOB_COMPLETED",
  PAYMENT_ACK: "PAYMENT_ACK",
  PAYMENT_REMINDER: "PAYMENT_REMINDER",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// ---------------------------------------------------------------------------
// CORE ENTITIES
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  jobPrefix: string;
  location?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isActive: boolean;
}

export interface AppUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  whatsappOptIn: boolean;
  creditBalance: number;
  notes?: string | null;
}

export interface PaperType {
  id: string;
  tenantId: string;
  name: string;
  category?: string | null;
  gsm?: number | null;
  unit: PricingUnit;
  singleSidePrice: number;
  /** null when this stock does not support double-sided printing (e.g. Sticker) */
  doubleSidePrice: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface FinishingService {
  id: string;
  tenantId: string;
  name: string;
  unit: PricingUnit;
  price: number;
  /** null when this service has no double-side tier (e.g. Folding) */
  doubleSidePrice: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  type: InventoryType;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  costPerUnit: number;
  paperTypeId?: string | null;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string | null;
  jobOrderId?: string | null;
  createdById?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// JOB ORDERS
// ---------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  jobOrderId: string;
  paperTypeId?: string | null;
  finishingServiceId?: string | null;
  description: string;
  sides?: SideOption | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface JobOrder {
  id: string;
  tenantId: string;
  jobNumber: string;
  clientId: string;
  status: JobOrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate?: string | null;
  notes?: string | null;
  createdById?: string | null;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Transaction {
  id: string;
  tenantId: string;
  jobOrderId: string;
  clientId: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  recordedById?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  jobOrderId?: string | null;
  clientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  sentAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// PRICE CALCULATOR INPUT/OUTPUT SHAPES
// ---------------------------------------------------------------------------

/** One requested print line item, before pricing is applied. */
export interface PriceLineRequest {
  /** Reference to a PaperType.id, omit for finishing-only lines */
  paperTypeId?: string;
  /** Reference to a FinishingService.id, omit for paper-only lines */
  finishingServiceId?: string;
  sides?: SideOption;
  quantity: number;
  /** Used for custom "Other" services that are not in the price matrix. */
  customUnitPrice?: number;
  /** Optional free-text override, otherwise derived from paper/finishing name */
  description?: string;
}

/** A priced line item ready to attach to a JobOrder. */
export interface PricedLine {
  description: string;
  paperTypeId?: string;
  finishingServiceId?: string;
  sides?: SideOption;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuoteRequest {
  lines: PriceLineRequest[];
  discountAmount?: number;
  vatRate?: number;
}

export interface QuoteResult {
  lines: PricedLine[];
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// ALUWOOD ENTERPRISES — DEFAULT TENANT SEED DATA
// ---------------------------------------------------------------------------

export const ALUWOOD_TENANT_SEED = {
  name: "Aluwood Enterprises",
  slug: "aluwood",
  jobPrefix: "ALU",
  location: "Ndaragwa House, Mezzanine Floor MF24",
  contactPhone: "0720115999",
} as const;

/** Default price matrix seed for Aluwood Enterprises, in KES. */
export const ALUWOOD_PAPER_PRICE_SEED: Array<
  Pick<PaperType, "name" | "category" | "gsm" | "singleSidePrice" | "doubleSidePrice">
> = [
  { name: "Art Paper 130 GSM", category: "Art Paper", gsm: 130, singleSidePrice: 18, doubleSidePrice: 28 },
  { name: "Art Paper 150 GSM", category: "Art Paper", gsm: 150, singleSidePrice: 20, doubleSidePrice: 32 },
  { name: "Art Paper 170 GSM", category: "Art Paper", gsm: 170, singleSidePrice: 22, doubleSidePrice: 36 },
  { name: "Art Card 250 GSM", category: "Art Card", gsm: 250, singleSidePrice: 25, doubleSidePrice: 38 },
  { name: "Art Card 300 GSM", category: "Art Card", gsm: 300, singleSidePrice: 26, doubleSidePrice: 40 },
  { name: "Sticker", category: "Sticker", gsm: null, singleSidePrice: 30, doubleSidePrice: null },
  { name: "Ivory", category: "Ivory", gsm: null, singleSidePrice: 35, doubleSidePrice: 50 },
  { name: "Bond A3 Coloured", category: "Bond A3", gsm: null, singleSidePrice: 12, doubleSidePrice: 20 },
  { name: "Bond A3 Black & White", category: "Bond A3", gsm: null, singleSidePrice: 5, doubleSidePrice: 10 },
  { name: "Bond A4 Coloured", category: "Bond A4", gsm: null, singleSidePrice: 8, doubleSidePrice: 15 },
  { name: "Bond A4 Black & White", category: "Bond A4", gsm: null, singleSidePrice: 2.5, doubleSidePrice: 5 },
  { name: "Own Paper", category: "Own Paper", gsm: null, singleSidePrice: 14, doubleSidePrice: 24 },
];

export const ALUWOOD_FINISHING_SEED: Array<Pick<FinishingService, "name" | "price" | "doubleSidePrice">> = [
  { name: "Lamination", price: 5, doubleSidePrice: 10 },
];
