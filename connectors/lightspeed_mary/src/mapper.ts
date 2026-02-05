//src/mapper.ts
// Mapper to convert Lightspeed API response to our Sale database
// This file is like a translator - it converts data from API format to database format
import { Sale, SaleLine } from "./models";

// This class converts API data to our database format
export class LightspeedMapper {
  // Convert API sales data to our Sale objects
  static toSales(apiSales: any[], businessLocationId: string): Sale[] {
    // For each sale in the API response...
    return apiSales.map((s) => ({
      receiptId: s.receiptId,                // Copy receipt ID
      timeClosed: s.timeClosed,              // Copy timestamp
      cancelled: s.cancelled ?? false,       // Default to false if not provided
      businessLocationId,                    // Add the store ID
    }));
  }
 // Convert API sales data to SaleLine objects (individual items)
  static toSaleLines(apiSales: any[]): SaleLine[] {
    const lines: SaleLine[] = []; // We'll collect all line items here

    for (const sale of apiSales) {
      for (const line of sale.salesLines ?? []) {
        lines.push({
          saleLineId: line.saleLineId,
          sku: line.sku ?? null,
          name: line.name ?? null,
          quantity: line.quantity ?? 0,
          menuListPrice: line.menuListPrice ?? null,
          discountAmount: line.discountAmount ?? null,
          taxAmount: line.taxAmount ?? null,
          serviceCharge: line.serviceCharge ?? null,
          receiptId: sale.receiptId,
        });
      }
    }

    return lines;
  }
}