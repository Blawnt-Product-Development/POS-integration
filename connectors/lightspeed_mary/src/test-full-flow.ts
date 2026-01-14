// connectors/lightspeed/src/test-full-flow.ts
// this test is for step 3 in INTERN_GUIDE

import { Database } from "./database";
import { LightspeedClient } from "./client";
import { LightspeedSync } from "./sync";
import { POSConnection } from "./models";

async function main() {
  // 1. Connect to your remote PostgreSQL database
  const db = new Database(process.env.DATABASE_URL!);

  // 2. Use mock API for testing Step 3
  const client = new LightspeedClient(
    "http://localhost:4020",   // mock API URL
    "anything"                 // mock API accepts ANY token
  );

  // 3. Create sync engine
  const sync = new LightspeedSync(client, db);

  // 4. Fake POS connection for testing
  const connection: POSConnection = {
    id: "test-connection-1",
    user_id: "test-user",
    restaurant_id: "45454565682155", // MUST MATCH your mock API
    provider: "lightspeed",
    api_key: "mock-api-key",
    api_secret: "",
    is_active: true,
    last_sync_date: null
  };

  // 5. Define test date range (mock API only uses "from")
  const from = new Date("2023-01-01");
  const to = new Date("2023-01-02"); // kept for compatibility

  // 6. Run full flow: fetch → map → save
  const stats = await sync.initialLoad(connection, from, to);

  console.log("Full flow test complete:");
  console.log("Fetched:", stats.fetched);
  console.log("Stored:", stats.stored);
  console.log("Errors:", stats.errors);
}

main().catch(console.error);