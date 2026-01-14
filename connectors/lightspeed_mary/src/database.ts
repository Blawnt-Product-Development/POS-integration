// connectors/lightspeed/src/database.ts
// Database operations for Lightspeed POS
import { Pool } from 'pg';
import { Sale, POSConnection } from './models';

export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  // Save a sale (upsert - insert or update if exists)
  async saveSale(sale: Sale): Promise<void> {
    const query = `
      INSERT INTO sales (
        id, restaurant_id, pos_transaction_id, pos_provider,
        total_amount, currency, transaction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (pos_provider, pos_transaction_id) 
      DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        transaction_date = EXCLUDED.transaction_date
    `;

    await this.pool.query(query, [
      sale.id,
      sale.restaurant_id,
      sale.pos_transaction_id,
      sale.pos_provider,
      sale.total_amount,
      sale.currency,
      sale.transaction_date
    ]);
  }

  // Save multiple sales
  async saveSales(sales: Sale[]): Promise<void> {
    for (const sale of sales) {
      await this.saveSale(sale);
    }
  }

  // Save POS connection
  async saveConnection(connection: POSConnection): Promise<void> {
    const query = `
      INSERT INTO pos_connections (
        id, user_id, restaurant_id, provider, api_key, api_secret, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, restaurant_id, provider)
      DO UPDATE SET
        api_key = EXCLUDED.api_key,
        api_secret = EXCLUDED.api_secret,
        is_active = EXCLUDED.is_active
    `;

    await this.pool.query(query, [
      connection.id,
      connection.user_id,
      connection.restaurant_id,
      connection.provider,
      connection.api_key,
      connection.api_secret,
      connection.is_active
    ]);
  }

  // Get connection by ID
  async getConnection(connectionId: string): Promise<POSConnection | null> {
    const result = await this.pool.query(
      'SELECT * FROM pos_connections WHERE id = $1',
      [connectionId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0] as POSConnection;
  }

  // Update last sync date
  async updateLastSyncDate(connectionId: string, date: Date): Promise<void> {
    await this.pool.query(
      'UPDATE pos_connections SET last_sync_date = $1 WHERE id = $2',
      [date, connectionId]
    );
  }

  // Get all active connections
  async getActiveConnections(): Promise<POSConnection[]> {
    const result = await this.pool.query(
      'SELECT * FROM pos_connections WHERE is_active = true'
    );
    return result.rows as POSConnection[];
  }
}