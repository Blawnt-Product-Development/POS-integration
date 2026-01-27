
//Part 4 in Intern guide
import "dotenv/config";
import { Database } from "./database";
import { v4 as uuid } from "uuid";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);

  await db.saveConnection({
    id: uuid(),
    store_id: "12345",
    access_token: "anything",
    refresh_token: null,
    last_sync: null,
  });

  console.log("Connection saved.");
}

main();