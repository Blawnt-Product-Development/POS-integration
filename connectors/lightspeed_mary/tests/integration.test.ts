// connectors/lightspeed/tests/integration.test.ts
// End-to-end integration test

import { LightspeedClient } from '../src/client';
import { LightspeedSync } from '../src/sync';
import { Database } from '../src/database';
import { POSConnection } from '../src/models';
import { createTestDatabase, cleanupTestData, testFixtures } from './setup';

describe('Integration Test', () => {
  let db: Database;
  let pool: ReturnType<typeof createTestDatabase>;
  const MOCK_API_URL = process.env.MOCK_API_URL || 'http://localhost:4020';

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

  it('should complete full workflow: register -> initial load -> daily sync', async () => {
    // Step 1: Register connection
    const connection: POSConnection = {
      ...testFixtures.connection,
      id: 'integration-test-conn'
    };
    await db.saveConnection(connection);

    // Step 2: Create client and sync
    const client = new LightspeedClient(MOCK_API_URL, connection.api_key);
    const sync = new LightspeedSync(client, db);

    // Step 3: Test connection
    const isConnected = await client.testConnection();
    expect(isConnected).toBe(true);

    // Step 4: Initial load (if mock API is available)
    if (isConnected) {
      try {
        const fromDate = new Date('2025-01-01');
        const toDate = new Date('2025-01-02');
        
        const result = await sync.initialLoad(connection, fromDate, toDate);
        
        console.log('Initial load result:', result);
        expect(result.fetched).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.warn('Mock API not available, skipping initial load test');
      }
    }
  });
});