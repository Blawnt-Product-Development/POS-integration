// connectors/lightspeed/src/mapper.ts
// Mapper to convert Lightspeed API response to our Sale database format 

//New code for testing

import { Sale } from "./models";

export class LightspeedMapper {
  static toSales(apiSales: any[], restaurantId: string): Sale[] {
    const results: Sale[] = [];

    for (const sale of apiSales) {
      const orderDate = sale.timeClosed;

      for (const line of sale.salesLines || []) {
        results.push({
          id: `${sale.receiptId}-${line.saleLineId}`,   // unique per line item
          restaurant_id: restaurantId,
          pos_transaction_id: sale.receiptId,
          pos_provider: "lightspeed",
          total_amount: line.menuListPrice,
          currency: "USD",
          transaction_date: new Date(orderDate)
        });
      }
    }

    return results;
  }
}