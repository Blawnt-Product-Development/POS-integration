import dotenv from "dotenv";
dotenv.config();
import { LightspeedClient } from "./client";
import { Database } from "./database";
console.log("URL:", process.env.LIGHTSPEED_API_URL);
async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  const client = new LightspeedClient(
  process.env.LIGHTSPEED_API_URL!,
  process.env.LIGHTSPEED_API_KEY!
);

  const stores = await client.fetchStores();

  for (const s of stores) {
    await db.saveStore({
      businessLocationId: s.blID,
      storeName: s.blName,
    });
  }

  console.log("Stores saved:", stores.length);
}

main();