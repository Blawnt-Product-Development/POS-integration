// connectors/lightspeed/src/test-full-flow.ts
//Part 4 of intern guide:
// src/test-full-flow.ts

import { Database } from "./database";
import { LightspeedClient } from "./client";
import { LightspeedSync } from "./sync";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  const client = new LightspeedClient(
    "http://localhost:4020",
    "anything"
  );

  const sync = new LightspeedSync(client, db);

  const connection = {
    id: "test-connection-full",
    business_id: "1234567890", // must match your mock store
    api_key: "anything",
    last_sync: null,
    active: true
  };

  const from = new Date("2023-01-01");
  const to = new Date("2023-01-02");

  const stats = await sync.initialLoad(connection, from, to);

  console.log("Full flow test complete:");
  console.log("Fetched:", stats.fetched);
  console.log("Stored:", stats.stored);
  console.log("Errors:", stats.errors);
}

main().catch(console.error);