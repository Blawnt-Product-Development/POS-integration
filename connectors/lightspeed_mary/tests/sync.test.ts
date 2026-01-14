// connectors/lightspeed/tests/sync.test.ts
// Tests for LightspeedSync

import { LightspeedSync } from '../src/sync';
import { LightspeedClient } from '../src/client';
import { Database } from '../src/database';
import { POSConnection } from '../src/models';
import { createTestDatabase, cleanupTestData, testFixtures } from './setup';

// Mock the client
jest.mock('../src/client');

describe('LightspeedSync', () => {
  let sync: LightspeedSync;
  let mockClient: jest.Mocked<LightspeedClient>;
  let db: Database;
  let pool: ReturnType<typeof createTestDatabase>;

  beforeAll(async () => {
    pool = createTestDatabase();
    db = new Database(process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_test');
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    
    // Create mock client
    mockClient = {
      fetchSales: jest.fn()
    } as any;

    sync = new LightspeedSync(mockClient, db);
  });

  describe('initialLoad', () => {
    it('should fetch and store sales successfully', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      const mockApiSales = [
        {
          id: 'ls-1',
          total: 100.50,
          dateTime: '2025-01-15T10:00:00Z',
          locationId: connection.restaurant_id
        },
        {
          id: 'ls-2',
          total: 200.75,
          dateTime: '2025-01-15T11:00:00Z',
          locationId: connection.restaurant_id
        }
      ];

      mockClient.fetchSales.mockResolvedValue(mockApiSales as any);

      const fromDate = new Date('2025-01-15');
      const toDate = new Date('2025-01-16');

      const result = await sync.initialLoad(connection, fromDate, toDate);

      expect(result.fetched).toBe(2);
      expect(result.stored).toBe(2);
      expect(result.errors).toBe(0);

      // Verify sales were saved
      const dbResult = await pool.query('SELECT * FROM sales');
      expect(dbResult.rows).toHaveLength(2);
    });

    it('should update last sync date after successful load', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      mockClient.fetchSales.mockResolvedValue([]);

      const toDate = new Date('2025-01-20');
      await sync.initialLoad(connection, new Date('2025-01-01'), toDate);

      const updated = await db.getConnection(connection.id);
      expect(updated?.last_sync_date).not.toBeNull();
    });

    it('should handle errors when saving individual sales', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      mockClient.fetchSales.mockResolvedValue([
        { id: 'ls-1', total: 100, dateTime: '2025-01-15T10:00:00Z', locationId: 'rest-456' }
      ] as any);

      // Force a database error by using invalid data
      const invalidSale = { ...testFixtures.sale, id: null as any };
      jest.spyOn(db, 'saveSale').mockRejectedValueOnce(new Error('DB Error'));

      const result = await sync.initialLoad(connection, new Date(), new Date());

      expect(result.errors).toBeGreaterThan(0);
    });
  });

  describe('dailySync', () => {
    it('should sync yesterday\'s data', async () => {
      const connection: POSConnection = testFixtures.connection;
      await db.saveConnection(connection);

      const mockApiSales = [
        {
          id: 'ls-yesterday',
          total: 150.00,
          dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          locationId: connection.restaurant_id
        }
      ];

      mockClient.fetchSales.mockResolvedValue(mockApiSales as any);

      const count = await sync.dailySync(connection);

      expect(count).toBe(1);
      expect(mockClient.fetchSales).toHaveBeenCalled();
    });
  });
});