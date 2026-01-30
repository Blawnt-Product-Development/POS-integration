// src/watermark-sync.ts
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedMapper } from "./mapper";

async function main() {
  console.log("Starting Watermark-Based Incremental Sync...");

  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );

  const connections = await db.getActiveConnections();
  if (connections.length === 0) {
    console.error("No active connections found.");
    process.exit(1);
  }

  for (const conn of connections) {
    console.log(`\nProcessing connection: ${conn.id}`);

    const lastSync = conn.last_sync ? new Date(conn.last_sync) : null;

    let from: Date;
    let to: Date = new Date();

    if (!lastSync) {
      // No watermark → fallback to yesterday
      from = new Date();
      from.setDate(from.getDate() - 1);
      console.log("No watermark found. Using yesterday as starting point.");
    } else {
      from = new Date(lastSync);
      console.log("Using watermark:", from.toISOString());
    }

    const apiSales = await client.fetchSales(
      conn.business_id,
      from,
      to
    );

    const sales = LightspeedMapper.toSales(apiSales, conn.business_id);
    const lines = LightspeedMapper.toSaleLines(apiSales);

    for (const s of sales) await db.saveSale(s);
    for (const l of lines) await db.saveSaleLine(l);

    // Compute new watermark (Option A)
    const newest = sales
      .map(s => new Date(s.timeClosed))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (newest) {
      await db.updateLastSyncDate(conn.id, newest.toISOString());
      console.log("Updated watermark to:", newest.toISOString());
    } else {
      console.log("No new sales found. Watermark unchanged.");
    }
  }

  await (db as any).pool.end();
  process.exit(0);
}

main();