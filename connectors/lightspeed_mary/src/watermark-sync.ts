// src/watermark-sync.ts
// This file implements watermark-based sync
// A "watermark" is like a bookmark - it remembers where we stopped reading
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedMapper } from "./mapper";

async function main() {
  console.log("Starting Watermark-Based Incremental Sync...");
  // Set up database and API client
  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );
  // Get all active connections
  const connections = await db.getActiveConnections();
  if (connections.length === 0) {
    console.error("No active connections found.");
    process.exit(1);
  }
  // Process each connection
  for (const conn of connections) {
    console.log(`\nProcessing connection: ${conn.id}`);
    // Check when we last synced (our watermark)
    const lastSync = conn.last_sync ? new Date(conn.last_sync) : null;

    let from: Date;
    let to: Date = new Date(); //Sync up to now

    if (!lastSync) {
      // No watermark → fallback to yesterday
      from = new Date();
      from.setDate(from.getDate() - 1);
      console.log("No watermark found. Using yesterday as starting point.");
    } else {
      // Use our existing watermark
      from = new Date(lastSync);
      console.log("Using watermark:", from.toISOString());
    }
    // Get sales since our watermark
    const apiSales = await client.fetchSales(
      conn.business_id,
      from,
      to
    );
    // Convert and save
    const sales = LightspeedMapper.toSales(apiSales, conn.business_id);
    const lines = LightspeedMapper.toSaleLines(apiSales);

    for (const s of sales) await db.saveSale(s);
    for (const l of lines) await db.saveSaleLine(l);

    // // Compute new watermark (find newest sale)
    const newest = sales
      .map(s => new Date(s.timeClosed))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (newest) {
      // Update watermark
      await db.updateLastSyncDate(conn.id, newest.toISOString());
      console.log("Updated watermark to:", newest.toISOString());
    } else {
      console.log("No new sales found. Watermark unchanged.");
    }
  }
  // Clean up
  await (db as any).pool.end();
  process.exit(0);
}

main();