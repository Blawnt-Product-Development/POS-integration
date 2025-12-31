// examples/register-connection.ts
import { Database } from '../connectors/lightspeed/src';
import { POSConnection } from '../connectors/lightspeed/src';

async function registerConnection() {
  const db = new Database(process.env.DATABASE_URL!);

  const connection: POSConnection = {
    id: 'conn-123',
    user_id: 'user-456',
    restaurant_id: 'rest-789',
    provider: 'lightspeed',
    api_key: 'user-entered-key',
    api_secret: 'user-entered-secret',
    is_active: true,
    last_sync_date: null
  };

  await db.saveConnection(connection);
  console.log('Connection saved!');
}