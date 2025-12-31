// examples/daily-sync.ts
import { LightspeedClient, LightspeedSync, Database } from '../connectors/lightspeed/src';

async function runDailySync() {
  const db = new Database(process.env.DATABASE_URL!);
  
  // Get all active connections
  const connections = await db.getActiveConnections();

  for (const connection of connections) {
    const client = new LightspeedClient(
      process.env.LIGHTSPEED_API_URL || 'http://localhost:4020',
      connection.api_key
    );
    const sync = new LightspeedSync(client, db);

    try {
      const count = await sync.dailySync(connection);
      console.log(`Synced ${count} sales for ${connection.id}`);
    } catch (error) {
      console.error(`Sync failed for ${connection.id}:`, error);
    }
  }
}

// Run daily at 2 AM (using node-cron or similar)
// cron.schedule('0 2 * * *', runDailySync);