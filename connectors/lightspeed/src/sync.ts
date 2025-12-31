// connectors/lightspeed/src/sync.ts
// Sync operations for Lightspeed POS
import { LightspeedClient } from './client';
import { LightspeedMapper } from './mapper';
import { Database } from './database';
import { POSConnection } from './models';

export class LightspeedSync {
  constructor(
    private client: LightspeedClient,
    private db: Database
  ) {}

  // Initial history load (from date to date)
  async initialLoad(
    connection: POSConnection,
    fromDate: Date,
    toDate: Date
  ): Promise<{ fetched: number; stored: number; errors: number }> {
    const stats = { fetched: 0, stored: 0, errors: 0 };

    try {
      // 1. Fetch from API
      const apiSales = await this.client.fetchSales(
        connection.restaurant_id,
        fromDate,
        toDate
      );
      stats.fetched = apiSales.length;

      // 2. Convert to our format
      const sales = LightspeedMapper.toSales(apiSales, connection.restaurant_id);

      // 3. Save to database
      for (const sale of sales) {
        try {
          await this.db.saveSale(sale);
          stats.stored++;
        } catch (error) {
          console.error('Failed to save sale:', error);
          stats.errors++;
        }
      }

      // 4. Update last sync date
      await this.db.updateLastSyncDate(connection.id, toDate);

      return stats;
    } catch (error) {
      console.error('Initial load failed:', error);
      throw error;
    }
  }

  // Daily sync (syncs yesterday's data)
  async dailySync(connection: POSConnection): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.initialLoad(connection, yesterday, today);
    return result.stored;
  }
}