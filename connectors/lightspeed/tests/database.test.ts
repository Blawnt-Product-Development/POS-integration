// connectors/lightspeed/tests/database.test.ts
// Tests for Database class

import { Database } from '../src/database';
import { Sale, POSConnection } from '../src/models';
import { createTestDatabase, cleanupTestData, testFixtures } from './setup';

describe('Database', () => {
  let db: Database;
  let pool: ReturnType<typeof createTestDatabase>;

  beforeAll(async () => {
    pool = createTestDatabase();
    db = new Database(process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_test');
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('saveSale', () => {
    it('should save a sale to database', async () => {
      const sale: Sale = testFixtures.sale;

      await db.saveSale(sale);

      const result = await pool.query('SELECT * FROM sales WHERE id = $1', [sale.id]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].total_amount).toBe('125.50');
      expect(result.rows[0].restaurant_id).toBe('rest-456');
    });

    it('should update existing sale on conflict', async () => {
      const sale: Sale = testFixtures.sale;
      await db.saveSale(sale);

      // Update the sale
      const updatedSale: Sale = {
        ...sale,
        total_amount: 200.00
      };
      await db.saveSale(updatedSale);

      const result = await pool.query(
        'SELECT * FROM sales WHERE pos_transaction_id = $1',
        [sale.pos_transaction_id]
      );
      expect(result.rows[0].total_amount).toBe('200.00');
    });
  });

  describe('saveConnection', () => {
    it('should save a POS connection', async () => {
      const connection: POSConnection = testFixtures.connection;

      await db.saveConnection(connection);

      const result = await pool.query('SELECT * FROM pos_connections WHERE id = $1', [connection.id]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].user_id).toBe('user-456');
      expect(result.rows[0].provider).toBe('lightspeed');
    });

    it('should update existing connection on conflict', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      const updatedConnection: POSConnection = {
        ...connection,
        api_key: 'new-api-key',
        is_active: false
      };
      await db.saveConnection(updatedConnection);

      const result = await pool.query('SELECT * FROM pos_connections WHERE id = $1', [connection.id]);
      expect(result.rows[0].api_key).toBe('new-api-key');
      expect(result.rows[0].is_active).toBe(false);
    });
  });

  describe('getConnection', () => {
    it('should retrieve a connection by ID', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      const result = await db.getConnection(connection.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(connection.id);
      expect(result?.user_id).toBe(connection.user_id);
    });

    it('should return null if connection not found', async () => {
      const result = await db.getConnection('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateLastSyncDate', () => {
    it('should update last sync date', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      const syncDate = new Date('2025-01-20T12:00:00Z');
      await db.updateLastSyncDate(connection.id, syncDate);

      const result = await pool.query('SELECT last_sync_date FROM pos_connections WHERE id = $1', [connection.id]);
      expect(new Date(result.rows[0].last_sync_date).toISOString()).toBe(syncDate.toISOString());
    });
  });
});