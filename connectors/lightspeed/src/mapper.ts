// connectors/lightspeed/src/mapper.ts
// Mapper to convert Lightspeed API response to our Sale database format
import { LightspeedSale, Sale } from './models';

export class LightspeedMapper {
  // Convert Lightspeed API response to our Sale format
  static toSale(apiSale: LightspeedSale, restaurantId: string): Sale {
    return {
      id: `sale-${apiSale.id}`,
      restaurant_id: restaurantId,
      pos_transaction_id: apiSale.id,
      pos_provider: 'lightspeed',
      total_amount: apiSale.total,
      currency: 'USD',
      transaction_date: new Date(apiSale.dateTime)
    };
  }

  // Convert array of API sales
  static toSales(apiSales: LightspeedSale[], restaurantId: string): Sale[] {
    return apiSales.map(sale => this.toSale(sale, restaurantId));
  }
}