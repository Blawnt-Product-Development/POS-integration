import { Database } from "./database";

async function main() {
  try {
    const db = new Database(process.env.DATABASE_URL!);
    await db.getActiveConnections(); // simple query to test connection
    console.log("Database connection successful!");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

main();