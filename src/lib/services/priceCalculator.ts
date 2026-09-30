/**
 * POMS price calculation service.
 *
 * Pure, side-effect-free pricing logic shared by the quotation UI, the job
 * order creation API, and PDF invoice generation. Given a tenant's price
 * catalog (paper types + finishing services) and a list of requested lines,
 * it resolves each line to a unit price and computes line/quote totals.
 *
 * Money is handled in plain `number` (KES has 2dp, JS floats are fine for
 * amounts of this size) but every total is rounded to 2 decimal places to
 * avoid floating point drift before it reaches the database/Decimal columns.
 */

import type {
  FinishingService,
  PaperType,
  PriceLineRequest,
  PricedLine,
  QuoteRequest,
  QuoteResult,
  SideOption,
} from "@/types/poms";

export class PriceCalculationError extends Error {}

export interface PriceCatalog {
  paperTypes: Pick<PaperType, "id" | "name" | "singleSidePrice" | "doubleSidePrice" | "isActive">[];
  finishingServices: Pick<FinishingService, "id" | "name" | "price" | "doubleSidePrice" | "isActive">[];
}

/** Round to 2 decimal places using a cent-safe approach. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveUnitPrice(
  sides: SideOption | undefined,
  singlePrice: number,
  doublePrice: number | null,
  itemLabel: string,
): number {
  if (sides === "DOUBLE") {
    if (doublePrice === null || doublePrice === undefined) {
      throw new PriceCalculationError(`${itemLabel} does not support double-sided printing`);
    }
    return doublePrice;
  }
  return singlePrice;
}

/**
 * Price a single requested line against the tenant's catalog.
 * Exactly one of `paperTypeId` / `finishingServiceId` must be provided.
 */
export function priceLine(request: PriceLineRequest, catalog: PriceCatalog): PricedLine {
  if (!request.quantity || request.quantity <= 0) {
    throw new PriceCalculationError("Quantity must be greater than zero");
  }
  if (!request.paperTypeId && !request.finishingServiceId) {
    throw new PriceCalculationError("Each line must reference a paper type or a finishing service");
  }
  if (request.paperTypeId && request.finishingServiceId) {
    throw new PriceCalculationError("A line cannot mix a paper type and a finishing service");
  }

  if (request.paperTypeId) {
    const paper = catalog.paperTypes.find((p) => p.id === request.paperTypeId);
    if (!paper) {
      throw new PriceCalculationError(`Unknown paper type: ${request.paperTypeId}`);
    }
    if (!paper.isActive) {
      throw new PriceCalculationError(`Paper type "${paper.name}" is no longer active`);
    }
    const unitPrice = resolveUnitPrice(request.sides, paper.singleSidePrice, paper.doubleSidePrice, paper.name);
    const lineTotal = round2(unitPrice * request.quantity);
    return {
      description: request.description ?? paper.name,
      paperTypeId: paper.id,
      sides: request.sides,
      quantity: request.quantity,
      unitPrice,
      lineTotal,
    };
  }

  const service = catalog.finishingServices.find((s) => s.id === request.finishingServiceId);
  if (!service) {
    throw new PriceCalculationError(`Unknown finishing service: ${request.finishingServiceId}`);
  }
  if (!service.isActive) {
    throw new PriceCalculationError(`Finishing service "${service.name}" is no longer active`);
  }
  const unitPrice = resolveUnitPrice(request.sides, service.price, service.doubleSidePrice, service.name);
  const lineTotal = round2(unitPrice * request.quantity);
  return {
    description: request.description ?? service.name,
    finishingServiceId: service.id,
    sides: request.sides,
    quantity: request.quantity,
    unitPrice,
    lineTotal,
  };
}

/** Price every line in a quote request and compute VAT-inclusive totals. */
export function calculateQuote(request: QuoteRequest, catalog: PriceCatalog): QuoteResult {
  if (!request.lines.length) {
    throw new PriceCalculationError("A quote must contain at least one line item");
  }

  const lines = request.lines.map((line) => priceLine(line, catalog));
  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const vatRate = request.vatRate ?? 0;
  const vatAmount = round2((subtotal * vatRate) / 100);
  const totalAmount = round2(subtotal + vatAmount);

  return { lines, subtotal, vatRate, vatAmount, totalAmount };
}
