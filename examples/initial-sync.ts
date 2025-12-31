// examples/initial-sync.ts
import { LightspeedClient, LightspeedSync, Database } from '../connectors/lightspeed/src';

async function initialSync() {
  // Setup
  const db = new Database(process.env.DATABASE_URL!);
  const connection = await db.getConnection('conn-123');
  if (!connection) {
    throw new Error('Connection not found');
  }

  // Create client and sync
  const client = new LightspeedClient(
    'http://localhost:4020',  // Mock API or real API
    connection.api_key
  );
  const sync = new LightspeedSync(client, db);

  // Do initial load
  const result = await sync.initialLoad(
    connection,
    new Date('2024-01-01'),
    new Date('2025-01-01')
  );

  console.log(`Fetched: ${result.fetched}, Stored: ${result.stored}`);
}