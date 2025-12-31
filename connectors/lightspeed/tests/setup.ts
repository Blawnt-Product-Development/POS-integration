// connectors/lightspeed/tests/setup.ts
// Test setup and utilities

import { Pool } from 'pg';

// Test database connection string
export const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_test';

// Helper to create test database connection
export function createTestDatabase(): Pool {
  return new Pool({ connectionString: TEST_DB_URL });
}

// Helper to clean up test data
export async function cleanupTestData(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM sales');
  await pool.query('DELETE FROM pos_connections');
}

// Helper to create test fixtures
export const testFixtures = {
  lightspeedSale: {
    id: 'ls-sale-123',
    total: 125.50,
    dateTime: '2025-01-15T10:30:00Z',
    locationId: 'rest-456'
  },
  
  sale: {
    id: 'sale-ls-sale-123',
    restaurant_id: 'rest-456',
    pos_transaction_id: 'ls-sale-123',
    pos_provider: 'lightspeed',
    total_amount: 125.50,
    currency: 'USD',
    transaction_date: new Date('2025-01-15T10:30:00Z')
  },
  
  connection: {
    id: 'conn-123',
    user_id: 'user-456',
    restaurant_id: 'rest-789',
    provider: 'lightspeed',
    api_key: 'test-api-key',
    api_secret: 'test-api-secret',
    is_active: true,
    last_sync_date: null
  }
};