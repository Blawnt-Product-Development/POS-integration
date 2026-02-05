
/* 
    src/create-connection.ts  
    This file creates a test connection in the database
    It's like adding a new contact to your phone - you're telling the system
    "Here's how to connect to this store"
*/ 
import "dotenv/config";
import { Database } from "./database";

async function main() {
  const db = new Database(process.env.DATABASE_URL!);
// Save a test connection to the database

  await db.saveConnection({
     id: "test-connection",      // Unique name for this connection
    business_id: "1234567890",  // Which store this connects to
    api_key: "anything",        // Password for the API
    last_sync: null,            // We haven't synced yet
    active: true                // This connection is turned on
  });

  console.log("Connection saved.");
}

main();