// connectors/lightspeed/src/mapper.ts
// Mapper to convert Lightspeed API response to our Sale database 
import { Sale, SaleLine } from "./models";

export class LightspeedMapper {
  static toSales(apiSales: any[], businessLocationId: string): Sale[] {
    return apiSales.map((s) => ({
      receiptId: s.receiptId,
      timeClosed: s.timeClosed,
      cancelled: s.cancelled ?? false,
      businessLocationId,
    }));
  }

  static toSaleLines(apiSales: any[]): SaleLine[] {
    const lines: SaleLine[] = [];

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