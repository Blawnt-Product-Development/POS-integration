// src/debug.ts
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";

async function main() {
  console.log("=== DEBUG RUN STARTED ===");

  const db = new Database(process.env.DATABASE_URL!);

  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );

  console.log("Fetching stores...");
  const stores = await client.fetchStores();
  console.log(`Found ${stores.length} stores`);

  for (const store of stores) {
    console.log(`\n--- Store ${store.blID} (${store.blName}) ---`);

    // DAILY SALES TEST
    const today = new Date();
    console.log("Testing fetchDailySales...");
    try {
      const daily = await client.fetchDailySales(store.blID, today);
      console.log("Daily sales OK:", daily);
    } catch (err) {
      console.error("Daily sales ERROR:", err);
    }

    // HISTORICAL SALES TEST
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    console.log("Testing fetchSales (last 30 days)...");
    try {
      const sales = await client.fetchSales(store.blID, from, to);
      console.log(`Historical sales OK: ${sales.length} records`);
    } catch (err) {
      console.error("Historical sales ERROR:", err);
    }
  }

  console.log("\n=== DEBUG RUN COMPLETE ===");
}

main().catch((err) => {
  console.error("Fatal error in debug runner:", err);
});