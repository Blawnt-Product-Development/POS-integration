// connectors/lightspeed/src/sync.ts
// Sync operations for Lightspeed POS

import { LightspeedClient } from "./client";
import { LightspeedMapper } from "./mapper";
import { Database } from "./database";
import { POSConnection } from "./models";

export class LightspeedSync {
  constructor(private client: LightspeedClient, private db: Database) {}

  async initialLoad(connection: POSConnection, from: Date, to: Date) {
    // Get sales data from API
    const apiSales = await this.client.fetchSales(
      connection.business_id,
      from,
      to
    );
    // Convert to our format
    const sales = LightspeedMapper.toSales(apiSales, connection.business_id);
    const lines = LightspeedMapper.toSaleLines(apiSales);
     // Save to database
    for (const s of sales) await this.db.saveSale(s);
    for (const l of lines) await this.db.saveSaleLine(l);
    // Record when we did this sync
    await this.db.updateLastSyncDate(connection.id, to.toISOString());
  }

  // Sync yesterday's sales data
  async dailySync(connection: POSConnection) {
  console.log("Starting dailySync for", connection.business_id);
  // Calculate yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const isoDate = yesterday.toISOString().split("T")[0];
  console.log("Yesterday:", isoDate);

  // Get daily sales data
  console.log("Fetching daily sales...");
  const daily = await this.client.fetchDailySales(connection.business_id, isoDate);
  console.log("Fetched daily sales:", daily.sales.length);

  // Convert to our format
  console.log("Mapping sales...");
  const sales = LightspeedMapper.toSales(daily.sales, connection.business_id);
  const lines = LightspeedMapper.toSaleLines(daily.sales);
  console.log("Mapped", sales.length, "sales and", lines.length, "lines");
  
  console.log("Saving sales...");
  for (const s of sales) await this.db.saveSale(s);

  console.log("Saving sale lines...");
  for (const l of lines) await this.db.saveSaleLine(l);

  console.log("Saving daily summary...");
  await this.db.saveDailySales({
    businessLocationId: connection.business_id,
    businessDate: isoDate,
    dataComplete: daily.dataComplete,
    totalSales: daily.totalSales ?? null,
  });

  console.log("dailySync complete for", connection.business_id);
}

  // Sync only new data since last sync
  async incrementalSync(connection: POSConnection) {
    console.log(`Running incremental sync for ${connection.business_id}`);
    // If never synced, use yesterday as starting point
    const lastSync = await this.db.getLastSyncDate(connection.id);
    const from = lastSync ? new Date(lastSync) : new Date(Date.now() - 86400000);
    const to = new Date();

    console.log("Using watermark:", from.toISOString());
    // Get sales since last sync
    const apiSales = await this.client.fetchSales(
      connection.business_id,
      from,
      to
    );

    // Convert and save
    const sales = LightspeedMapper.toSales(apiSales, connection.business_id);
    const lines = LightspeedMapper.toSaleLines(apiSales);

    for (const s of sales) await this.db.saveSale(s);
    for (const l of lines) await this.db.saveSaleLine(l);

    // Update watermark to newest timeClosed
    const newest = sales
      .map(s => new Date(s.timeClosed))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (newest) {
      // update when we last synced
      await this.db.updateLastSyncDate(connection.id, newest.toISOString());
      console.log("Updated watermark to:", newest.toISOString());
    } else {
      console.log("No new sales found. Watermark unchanged.");
    }
  }
    // Run incremental sync for all active connections
    async runIncrementalSync() {
    const connections = await this.db.getActiveConnections();

    for (const conn of connections) {
      try {
        await this.incrementalSync(conn);
      } catch (err) {
        console.error("Incremental sync failed for", conn.business_id, err);
      }
    }
  }
  // Run daily sync for all active connections
  async runDailySync() {
    const connections = await this.db.getActiveConnections();

    for (const conn of connections) {
      try {
        await this.dailySync(conn);
      } catch (err) {
        console.error("Failed daily sync for", conn.business_id, err);
      }
    }
  }
}