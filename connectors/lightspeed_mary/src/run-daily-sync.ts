// src/run-daily-sync.ts
import dotenv from "dotenv";
dotenv.config();

import { LightspeedClient } from "./client";
import { Database } from "./database";
import { LightspeedSync } from "./sync";

async function main() {
  console.log("Starting Daily Sync...");

  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );

  const sync = new LightspeedSync(client, db);

  await sync.runDailySync();

  await (db as any).pool.end();
  console.log("Daily Sync complete.");
}

main();