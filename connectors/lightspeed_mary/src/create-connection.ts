
// src/create-connection.ts
import "dotenv/config";
import { Database } from "./database";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  await db.saveConnection({
    id: "test-connection",
    business_id: "1234567890", // your real store ID
    api_key: "anything",
    last_sync: null,
    active: true
  });

  console.log("Connection saved.");
}

main();