// src/fetch-stores.ts
// This file gets store information from the API and saves it to our database
// It's like making a phone book of all the stores
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );
// Get stores from API
  const stores = await client.fetchStores();
// Save each store to database
  for (const s of stores) {
    await db.saveStore({
      businessLocationId: s.blID,    //store ID
      storeName: s.blName,          // Store name
    });
  }

  // Show how many stores we saved
  console.log("Stores saved:", stores.length);

  // Close DB pool so Node exits cleanly
  // Important: database connections need to be closed properly
  await (db as any).pool.end();
  process.exit(0);
}

main();