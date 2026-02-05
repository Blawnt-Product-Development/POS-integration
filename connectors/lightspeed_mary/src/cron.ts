// src/cron.ts
// This file sets up automatic daily syncs
// Like setting an alarm clock to run the sync every morning

import dotenv from "dotenv";
// load settings
dotenv.config(); 
console.log("Cron job started");

import { LightspeedSync } from "./sync";
import { LightspeedClient } from "./client";
import { Database } from "./database";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);
// Create API client with our settings
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,  //api address
    process.env.LIGHTSPEED_API_KEY!   // api password
  );

  // Create sync engine (combines client + database)
  const sync = new LightspeedSync(client, db);

  console.log("Running daily sync now (test mode)...");
  await sync.runDailySync();

// This is what would run on a schedule (commented out for testing)
// It says "run at 2 AM every day"
//   cron.schedule("0 2 * * *", async () => {
//   console.log("Running daily sync at 2 AM");
//   await sync.runDailySync();
// });

  console.log("Daily sync finished. Exiting.");
  process.exit(0); 
}

main();