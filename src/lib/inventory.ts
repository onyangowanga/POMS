export function inventoryQuantityForPrintedSheets(sheetQuantity: number, unit: string): number {
  return unit.toLowerCase() === "ream" ? sheetQuantity / 500 : sheetQuantity;
}
