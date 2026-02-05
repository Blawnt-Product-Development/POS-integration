import dotenv from "dotenv";
dotenv.config();
import { Database } from "./database";

async function main() {
  try {
    // Try to connect to database
    const db = new Database(process.env.DATABASE_URL!);
    
    // Try a simple query
    await db.getActiveConnections();
    
    // If we get here, it worked!
    console.log("Database connection successful!");
  } catch (err) {
    // Something went wrong
    console.error("Database connection failed:", err);
  }
}

main();