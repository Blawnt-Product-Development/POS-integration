// src/fetch-daily-sales.ts
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedMapper } from "./mapper";

async function main() {
  console.log("Starting daily sales fetch test...");

  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );

  // 1. Get stores
  const stores = await db.getStores();
  if (stores.length === 0) {
    console.error("No stores found. Run fetch-stores.ts first.");
    process.exit(1);
  }

  // 2. Use yesterday's date
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const isoDate = date.toISOString().split("T")[0];

  console.log("Fetching daily sales for:", isoDate);

  for (const store of stores) {
    console.log(`\nStore ${store.businessLocationId}: Fetching daily sales...`);

    const daily = await client.fetchDailySales(
      store.businessLocationId,
      isoDate
    );

    console.log("Raw daily response:", JSON.stringify(daily, null, 2));

    // 3. Check dataComplete
    if (!daily.dataComplete) {
      console.log(
        `Store ${store.businessLocationId}: dataComplete = false. Skipping.`
      );
      continue;
    }

    console.log(
      `Store ${store.businessLocationId}: dataComplete = true. Processing...`
    );

    // 4. Map and save
    const sales = LightspeedMapper.toSales(daily.sales, store.businessLocationId);
    const lines = LightspeedMapper.toSaleLines(daily.sales);

    for (const s of sales) await db.saveSale(s);
    for (const l of lines) await db.saveSaleLine(l);

    console.log(
      `Saved ${sales.length} sales and ${lines.length} sale lines for store ${store.businessLocationId}`
    );
  }

  await (db as any).pool.end();
  process.exit(0);
}

main();