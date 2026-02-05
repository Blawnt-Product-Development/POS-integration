// src/run-daily-sync.ts
// This file runs the daily sync process
// It's the main entry point for syncing yesterday's sales
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedSync } from "./sync";

async function main() {
  console.log("Starting Daily Sync...");
  // Set up database and API client
  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );
  // create sync engine
  const sync = new LightspeedSync(client, db);
  //Run saily sync
  await sync.runDailySync();
  // Clean up database connection
  await (db as any).pool.end();
  console.log("Daily Sync complete.");
}

main();