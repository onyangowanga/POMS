import type { PricedLine } from "@/types/poms";

export function formatWhatsAppJobMessage(input: {
  kind: "QUOTATION" | "ORDER";
  reference: string;
  clientName: string;
  lines: PricedLine[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
}): string {
  const title = input.kind === "ORDER" ? "ALUWOOD ENTERPRISES INVOICE" : "ALUWOOD ENTERPRISES QUOTATION";
  const status = input.kind === "ORDER" ? "PENDING PAYMENT" : "QUOTATION";
  const itemLines = input.lines.map((line, index) => `${index + 1}. ${line.quantity} x ${line.description} - Kshs. ${line.lineTotal.toFixed(2)}`).join("\n");
  const discount = input.discountAmount > 0 ? `\nDISCOUNT: Kshs. ${input.discountAmount.toFixed(2)}` : "";
  const vat = input.vatAmount > 0 ? `\nVAT: Kshs. ${input.vatAmount.toFixed(2)}` : "";
  const payment = input.kind === "ORDER"
    ? "Please make payment to Till No. 5675635 to confirm this order.\nProduction begins after receipt of payment."
    : "This quotation is valid for confirmation. Production begins after receipt of payment.";

  return `${title}\nReference: ${input.reference}\nStatus: ${status}\nClient: ${input.clientName}\n\n${itemLines}\n\nSUBTOTAL: Kshs. ${input.subtotal.toFixed(2)}${discount}${vat}\nTOTAL: Kshs. ${input.totalAmount.toFixed(2)}\n\n${payment}\nDelivery/collection details will be confirmed by Aluwood Enterprises.`;
}
