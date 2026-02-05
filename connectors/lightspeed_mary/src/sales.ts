// src/test-initial-load.ts ---->  sales.ts
// Tests loading historical sales data
// This is for when we first set up a store and need old data
import dotenv from "dotenv";
dotenv.config();

import { LightspeedSync } from "./sync";
import { LightspeedClient } from "./client";
import { Database } from "./database";

async function main() {
  console.log("Starting initial load test...");

  const db = new Database(process.env.DATABASE_URL!);
  const client = new LightspeedClient(
    process.env.LIGHTSPEED_API_URL!,
    process.env.LIGHTSPEED_API_KEY!
  );
  const sync = new LightspeedSync(client, db);

  //Get real connection from DataBase
  const connections = await db.getActiveConnections();
  if (connections.length === 0) {
    console.error("No active connections found in pos_connections.");
    process.exit(1);
  }
 // Use the first active connection
  const conn = connections[0];
  console.log("Using connection:", conn);

  //Choose date range for initial load
  const from = new Date("2023-01-01");
  const to = new Date("2023-01-02");

  console.log("Running initial load...");
  await sync.initialLoad(conn, from, to);

  console.log("Initial load completed.");

  // Closes DataBase pool so Node can exit
  await db["pool"].end();
  process.exit(0);
}

main();