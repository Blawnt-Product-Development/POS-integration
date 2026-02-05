// src/run-incremental-sync.ts
// This file runs incremental sync (only new data since last sync)
// It's more efficient than daily sync because it only gets new data
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedSync } from "./sync";

async function main() {
  console.log("Starting Incremental Sync...");
  // Set up database and API client
  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );
  
  // Create sync engine
  const sync = new LightspeedSync(client, db);
  
  // Run incremental sync
  await sync.runIncrementalSync();
  
  // Clean up
  await (db as any).pool.end();
  console.log("Incremental Sync complete.");
}

main();