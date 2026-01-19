// connectors/lightspeed/src/mapper.ts
// Mapper to convert Lightspeed API response to our Sale database format

import { Sale } from "./models";

export class LightspeedMapper {
  static toSales(apiSales: any[], restaurantId: string): Sale[] {
    const results: Sale[] = [];

    for (const sale of apiSales || []) {
      const orderDate = sale.timeClosed || sale.timeOpened || new Date().toISOString();
      const receiptId = sale.receiptId ?? sale.id ?? "unknown";

      // Ensure salesLines exists and is an array
      const lines = Array.isArray(sale.salesLines) ? sale.salesLines : [];

      for (const line of lines) {
        const saleLineId = line.saleLineId ?? line.id ?? Math.random().toString(36).slice(2);

        results.push({
          id: `${receiptId}-${saleLineId}`, // unique per line item
          restaurant_id: restaurantId,
          pos_transaction_id: receiptId,
          pos_provider: "lightspeed",

          // Amount fields
          total_amount: Number(line.menuListPrice ?? line.price ?? 0),

          // Currency (mock API usually doesn't include this)
          currency: sale.currency ?? "USD",

          // Date
          transaction_date: new Date(orderDate)
        });
      }
    }

    return results;
  }
}