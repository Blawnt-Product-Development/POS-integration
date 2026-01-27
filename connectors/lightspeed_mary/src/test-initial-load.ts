import { LightspeedSync } from "./sync";
import { LightspeedClient } from "./client";
import { Database } from "./database";
import "dotenv/config";
console.log("LIGHTSPEED_API_URL =", process.env.LIGHTSPEED_API_URL);
console.log("LIGHTSPEED_API_KEY =", process.env.LIGHTSPEED_API_KEY);
console.log("DATABASE_URL =", process.env.DATABASE_URL); 
async function main() {
  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(process.env.LIGHTSPEED_API_URL!, process.env.LIGHTSPEED_API_KEY!);

  const sync = new LightspeedSync(client, db);

const connection = {
  id: "test-connection",
  store_id: "1234567890",
  access_token: process.env.LIGHTSPEED_API_KEY!,
  refresh_token: null,
  last_sync: null,
  active:true
};

  await sync.initialLoad(connection, new Date("2023-01-01"), new Date("2023-01-02"));
  console.log("Initial load completed.");

}

main();