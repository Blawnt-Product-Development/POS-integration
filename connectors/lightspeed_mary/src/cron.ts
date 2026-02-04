// src/cron.ts
import dotenv from "dotenv";
dotenv.config();
console.log("Cron job started");

import { LightspeedSync } from "./sync";
import { LightspeedClient } from "./client";
import { Database } from "./database";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );

  const sync = new LightspeedSync(client, db);

  // Run daily sync once for testing
  console.log("Running daily sync now (test mode)...");
  await sync.runDailySync();

//   cron.schedule("0 2 * * *", async () => {
//   console.log("Running daily sync at 2 AM");
//   await sync.runDailySync();
// });

  console.log("Daily sync finished. Exiting.");
  process.exit(0); // Force program to end
}

main();