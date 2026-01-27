// connectors/lightspeed/src/sync.ts
// Sync operations for Lightspeed POS

import { LightspeedClient } from "./client";
import { LightspeedMapper } from "./mapper";
import { Database } from "./database";
import { POSConnection } from "./models";

export class LightspeedSync {
  constructor(private client: LightspeedClient, private db: Database) {}

  async initialLoad(connection: POSConnection, from: Date, to: Date) {
    const apiSales = await this.client.fetchSales(
      connection.store_id,
      from,
      to
    );

    const sales = LightspeedMapper.toSales(apiSales, connection.store_id);
    const lines = LightspeedMapper.toSaleLines(apiSales);

    for (const s of sales) await this.db.saveSale(s);
    for (const l of lines) await this.db.saveSaleLine(l);

    await this.db.updateLastSyncDate(connection.id, to.toISOString());
  }

  async dailySync(connection: POSConnection) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const daily = await this.client.fetchDailySales(
      connection.store_id,
      yesterday
    );

    const sales = LightspeedMapper.toSales(daily.sales, connection.store_id);
    const lines = LightspeedMapper.toSaleLines(daily.sales);

    for (const s of sales) await this.db.saveSale(s);
    for (const l of lines) await this.db.saveSaleLine(l);

    await this.db.saveDailySales({
      businessLocationId: connection.store_id,
      businessDate: yesterday.toISOString().split("T")[0],
      dataComplete: daily.dataComplete,
      totalSales: daily.totalSales ?? null,
    });
  }
  //For part 4 
  async runDailySync() {
    const connections = await this.db.getActiveConnections();

    for (const conn of connections) {
      try {
        await this.dailySync(conn);
      } catch (err) {
        console.error("Failed daily sync for", conn.store_id, err);
      }
    }
  }
}