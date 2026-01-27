import dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";
import { LightspeedSync } from "./sync";
import { LightspeedClient } from "./client";
import { Database } from "./database";
//import "dotenv/config";

const db = new Database(process.env.DATABASE_URL!);
const client = new LightspeedClient(
  process.env.LIGHTSPEED_API_URL!,
  process.env.LIGHTSPEED_API_KEY!
);

const sync = new LightspeedSync(client, db);

cron.schedule("0 2 * * *", async () => {
  console.log("Running daily sync at 2 AM");
  await sync.runDailySync();
});