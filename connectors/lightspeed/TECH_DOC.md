# Lightspeed Connector - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Component Details](#component-details)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Usage Examples](#usage-examples)

---

## Overview

The Lightspeed Connector is a simple Node.js library that fetches sales data from the Lightspeed Restaurant POS system and stores it in a PostgreSQL database. It's designed to be straightforward and easy to understand.

### What It Does
1. **Connects** to Lightspeed API using user-provided credentials
2. **Fetches** sales data for a given date range
3. **Transforms** the data into our standard format
4. **Stores** the data in PostgreSQL database
5. **Supports** both initial history load and daily sync

---

## Architecture

### High-Level Flow

User Credentials
↓
POS Connection (stored in DB)
↓
LightspeedClient (HTTP requests)
↓
LightspeedMapper (data transformation)
↓
Database (PostgreSQL storage)


### Component Relationships
┌─────────────────┐
│ LightspeedSync  │ ← Main orchestrator
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌── ▼────┐
│Client │ │Database│
└───┬───┘ └───┬─── ┘
    │         │
    │    ┌────▼────┐
    └───►│ Mapper  │
         └─────────┘

---

## File Structure
connectors/lightspeed/
├── src/
│ ├── models.ts # TypeScript interfaces/types
│ ├── client.ts # HTTP client for Lightspeed API
│ ├── mapper.ts # Data transformation logic
│ ├── database.ts # PostgreSQL operations
│ ├── sync.ts # Main sync orchestration
│ └── index.ts # Public exports
├── tests/
│ ├── setup.ts # Test utilities
│ ├── client.test.ts # Client tests
│ ├── mapper.test.ts # Mapper tests
│ ├── database.test.ts # Database tests
│ ├── sync.test.ts # Sync tests
│ └── integration.test.ts # E2E tests
├── migrations/
│ └── 001_create_tables.sql
└── package.json


---

## Component Details

### 1. models.ts - Data Types

**Purpose**: Defines all TypeScript interfaces used throughout the connector.

**What it contains**:

#### `LightspeedSale`
- **What**: The raw data structure returned by Lightspeed API
- **Fields**:
  - `id`: Transaction ID from Lightspeed
  - `total`: Sale amount
  - `dateTime`: ISO timestamp string
  - `locationId`: Restaurant location ID
- **Usage**: This is what we receive from the API

#### `Sale`
- **What**: Our standardized sale format for database storage
- **Fields**:
  - `id`: Our generated ID (format: `sale-{lightspeed-id}`)
  - `restaurant_id`: Which restaurant this belongs to
  - `pos_transaction_id`: Original Lightspeed transaction ID
  - `pos_provider`: Always `'lightspeed'` (for multi-POS support later)
  - `total_amount`: Sale amount as number
  - `currency`: Currency code (default: 'USD')
  - `transaction_date`: JavaScript Date object
- **Usage**: This is what we store in the database

#### `POSConnection`
- **What**: Stores user's POS credentials and sync status
- **Fields**:
  - `id`: Unique connection ID
  - `user_id`: SaaS user ID
  - `restaurant_id`: Restaurant identifier
  - `provider`: POS provider name ('lightspeed')
  - `api_key`: User's API key (should be encrypted in production)
  - `api_secret`: User's API secret (should be encrypted in production)
  - `is_active`: Whether daily sync is enabled
  - `last_sync_date`: When we last synced data
- **Usage**: Stored in database to track connections

**Why it exists**: TypeScript needs type definitions. This file ensures type safety across the codebase.

---

### 2. client.ts - HTTP Client

**Purpose**: Handles all communication with the Lightspeed API.

**What it does**:
- Creates an HTTP client using Axios
- Adds authentication headers
- Makes API requests to fetch sales data
- Handles errors

**Key Methods**:

#### `constructor(baseUrl, apiKey)`
- **What**: Initializes the HTTP client
- **Parameters**:
  - `baseUrl`: Base URL of Lightspeed API (e.g., `http://localhost:4020` for mock)
  - `apiKey`: Bearer token for authentication
- **What it does internally**:
  - Creates an Axios instance
  - Sets `Authorization: Bearer {apiKey}` header
  - Sets `Content-Type: application/json` header

#### `fetchSales(businessLocationId, fromDate, toDate)`
- **What**: Fetches sales from Lightspeed API
- **Parameters**:
  - `businessLocationId`: Restaurant location ID
  - `fromDate`: Start date (JavaScript Date)
  - `toDate`: End date (JavaScript Date)
- **Returns**: `Promise<LightspeedSale[]>` - Array of raw sales from API
- **What it does**:
  1. Converts dates to ISO strings
  2. Makes GET request to `/f/v2/business-location/{id}/sales`
  3. Passes `from`, `to`, and `pageSize` as query parameters
  4. Extracts `sales` array from response
  5. Returns empty array if no sales found

**Example API Call**:
```
GET /f/v2/business-location/rest-123/sales?from=2025-01-01T00:00:00.000Z&to=2025-01-31T23:59:59.999Z&pageSize=100
Headers:
  Authorization: Bearer test-api-key
```


#### `testConnection()`
- **What**: Tests if API credentials are valid
- **Returns**: `Promise<boolean>` - true if connection works
- **What it does**:
  1. Makes a simple GET request to `/f/data/businesses`
  2. Returns `true` if successful, `false` if error

**Why it exists**: Separates HTTP concerns from business logic. Makes it easy to mock in tests.

---

### 3. mapper.ts - Data Transformation

**Purpose**: Converts Lightspeed API format to our database format.

**What it does**:
- Transforms API response structure to our structure
- Handles data type conversions (string dates → Date objects)
- Generates our IDs from POS transaction IDs

**Key Methods**:

#### `toSale(apiSale, restaurantId)`
- **What**: Converts a single Lightspeed sale to our format
- **Parameters**:
  - `apiSale`: `LightspeedSale` from API
  - `restaurantId`: Restaurant ID to associate with
- **Returns**: `Sale` object ready for database
- **Transformation logic**:
  - `id`: `'sale-' + apiSale.id` (prefixes with 'sale-')
  - `restaurant_id`: Uses provided `restaurantId`
  - `pos_transaction_id`: Original `apiSale.id`
  - `pos_provider`: Always `'lightspeed'`
  - `total_amount`: Direct copy of `apiSale.total`
  - `currency`: Hardcoded to `'USD'` (can be made dynamic later)
  - `transaction_date`: Converts ISO string to Date object

#### `toSales(apiSales, restaurantId)`
- **What**: Converts array of sales
- **Parameters**:
  - `apiSales`: Array of `LightspeedSale[]`
  - `restaurantId`: Restaurant ID
- **Returns**: Array of `Sale[]`
- **Implementation**: Simply maps over array calling `toSale()` for each

**Why it exists**: API format ≠ Database format. This keeps transformation logic in one place.

---

### 4. database.ts - PostgreSQL Operations

**Purpose**: Handles all database interactions.

**What it does**:
- Manages PostgreSQL connection pool
- Provides methods to save/retrieve data
- Handles SQL queries and transactions

**Key Methods**:

#### `constructor(connectionString)`
- **What**: Initializes database connection
- **Parameters**: PostgreSQL connection string
- **What it does**: Creates a connection pool using `pg` library

#### `saveSale(sale)`
- **What**: Saves a sale to database (upsert - insert or update)
- **SQL Logic**:
  - Uses `INSERT ... ON CONFLICT` to handle duplicates
  - Conflict key: `(pos_provider, pos_transaction_id)` - unique combination
  - If sale already exists, updates `total_amount` and `transaction_date`
- **Why upsert**: Prevents duplicate sales if we sync the same date range twice

#### `saveSales(sales)`
- **What**: Saves multiple sales
- **Implementation**: Loops through array calling `saveSale()` for each
- **Note**: Could be optimized with batch insert, but simple loop works for now

#### `saveConnection(connection)`
- **What**: Saves POS connection credentials
- **SQL Logic**:
  - Uses `INSERT ... ON CONFLICT` on `(user_id, restaurant_id, provider)`
  - If connection exists, updates credentials and active status
- **Why**: Allows users to update their API keys

#### `getConnection(connectionId)`
- **What**: Retrieves a connection by ID
- **Returns**: `POSConnection | null`
- **SQL**: Simple `SELECT * WHERE id = $1`

#### `updateLastSyncDate(connectionId, date)`
- **What**: Updates when we last synced for a connection
- **Why**: Tracks sync history, useful for debugging and reporting

**Why it exists**: Separates database concerns. Makes it easy to swap databases later if needed.

---

### 5. sync.ts - Main Orchestration

**Purpose**: Coordinates the entire sync process.

**What it does**:
- Combines client, mapper, and database
- Handles error tracking
- Provides high-level sync operations

**Key Methods**:

#### `constructor(client, db)`
- **What**: Initializes sync with dependencies
- **Dependency Injection**: Takes client and database as parameters (makes testing easier)

#### `initialLoad(connection, fromDate, toDate)`
- **What**: Fetches and stores sales for a date range
- **Parameters**:
  - `connection`: `POSConnection` with credentials
  - `fromDate`: Start date
  - `toDate`: End date
- **Returns**: `{ fetched: number, stored: number, errors: number }`
- **Step-by-step process**:
  1. **Fetch**: Calls `client.fetchSales()` with connection's restaurant_id
  2. **Transform**: Calls `mapper.toSales()` to convert format
  3. **Store**: Loops through sales, calls `db.saveSale()` for each
  4. **Track**: Counts fetched, stored, and errors
  5. **Update**: Calls `db.updateLastSyncDate()` with end date
- **Error Handling**: Catches errors per sale, continues with others

#### `dailySync(connection)`
- **What**: Syncs yesterday's sales (for daily automation)
- **Parameters**: `connection` - POS connection
- **Returns**: Number of sales stored
- **Logic**:
  1. Calculates yesterday's date (00:00:00 to 00:00:00 today)
  2. Calls `initialLoad()` with yesterday's date range
  3. Returns count of stored sales

**Why it exists**: This is the main entry point. Hides complexity of coordinating multiple components.

---

### 6. index.ts - Public API

**Purpose**: Exports everything for external use.

**What it exports**:
- `LightspeedClient`
- `LightspeedSync`
- `Database`
- `LightspeedMapper`
- All types from `models.ts`

**Why it exists**: Provides a clean public API. Users only import from `index.ts`.

---

## Data Flow

### Complete Workflow: Initial History Load

1. User provides credentials
↓
2. Save connection to database
{
id: 'conn-123',
user_id: 'user-456',
restaurant_id: 'rest-789',
api_key: 'key-abc',
api_secret: 'secret-xyz'
}
↓
3. Create LightspeedClient
client = new LightspeedClient('http://api.url', 'key-abc')
↓
4. Create LightspeedSync
sync = new LightspeedSync(client, database)
↓
5. Call initialLoad()
sync.initialLoad(connection, fromDate, toDate)
↓
6. Client fetches from API
GET /f/v2/business-location/rest-789/sales?from=...&to=...
Returns: [
{ id: 'ls-1', total: 100, dateTime: '2025-01-15T10:00:00Z', ... },
{ id: 'ls-2', total: 200, dateTime: '2025-01-15T11:00:00Z', ... }
]
↓
7. Mapper transforms
   [
     { id: 'sale-ls-1', pos_transaction_id: 'ls-1', total_amount: 100, ... },
     { id: 'sale-ls-2', pos_transaction_id: 'ls-2', total_amount: 200, ... }
   ]
↓
7. Database saves each sale
   INSERT INTO sales (...) VALUES (...)
   ON CONFLICT DO UPDATE ...
   ↓
8. Update last sync date
   UPDATE pos_connections SET last_sync_date = '2025-01-31' WHERE id = 'conn-123'
   ↓
9. Return stats
   { fetched: 2, stored: 2, errors: 0 }


### Daily Sync Flow

1. Cron job triggers daily sync
↓
2. Get all active connections from database
SELECT * FROM pos_connections WHERE is_active = true
↓
3. For each connection:
   - Create client with connection's API key
   - Create sync instance
   - Call dailySync(connection)
   ↓
4. dailySync calculates yesterday's date
   yesterday = today - 1 day (00:00:00 to 00:00:00)
   ↓
5. Calls initialLoad() with yesterday's range
   (same flow as above)


---

## Database Schema

### `sales` Table

CREATE TABLE sales (
  id VARCHAR(255) PRIMARY KEY,                    -- Our generated ID
  restaurant_id VARCHAR(255) NOT NULL,            -- Which restaurant
  pos_transaction_id VARCHAR(255) NOT NULL,      -- Original POS transaction ID
  pos_provider VARCHAR(50) NOT NULL,             -- 'lightspeed', 'clover', etc.
  total_amount DECIMAL(10, 2) NOT NULL,          -- Sale amount
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',    -- Currency code
  transaction_date TIMESTAMP NOT NULL,           -- When sale occurred
  created_at TIMESTAMP NOT NULL DEFAULT NOW()    -- When we stored it
);

-- Unique constraint prevents duplicates
UNIQUE(pos_provider, pos_transaction_id)

-- Index for fast queries by restaurant and date
CREATE INDEX idx_sales_restaurant_date ON sales(restaurant_id, transaction_date);
```

**Why this design**:
- `UNIQUE(pos_provider, pos_transaction_id)`: Prevents duplicate sales across syncs
- Index on `(restaurant_id, transaction_date)`: Fast queries for "sales for restaurant X in date range"

### `pos_connections` Table

CREATE TABLE pos_connections (
  id VARCHAR(255) PRIMARY KEY,                   -- Connection ID
  user_id VARCHAR(255) NOT NULL,                -- SaaS user ID
  restaurant_id VARCHAR(255) NOT NULL,          -- Restaurant ID
  provider VARCHAR(50) NOT NULL,                 -- 'lightspeed'
  api_key VARCHAR(255) NOT NULL,                 -- API credentials (encrypt in production!)
  api_secret VARCHAR(255) NOT NULL,              -- API credentials (encrypt in production!)
  is_active BOOLEAN NOT NULL DEFAULT true,        -- Daily sync enabled?
  last_sync_date TIMESTAMP,                      -- Last successful sync
  created_at TIMESTAMP NOT NULL DEFAULT NOW()    -- When connection created
);

-- One connection per user/restaurant/provider combination
UNIQUE(user_id, restaurant_id, provider)

-- Index for finding active connections
CREATE INDEX idx_connections_user ON pos_connections(user_id);
```

**Why this design**:
- `UNIQUE(user_id, restaurant_id, provider)`: One connection per restaurant per user
- `is_active`: Can disable daily sync without deleting connection
- `last_sync_date`: Track sync history

---

## Testing

### Test Structure

```
tests/
├── setup.ts              # Test utilities and fixtures
├── client.test.ts         # Test HTTP client
├── mapper.test.ts         # Test data transformation
├── database.test.ts       # Test database operations
├── sync.test.ts          # Test sync orchestration
└── integration.test.ts   # End-to-end tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Database Setup

1. **Create test database**:
```bash
createdb pos_test
```

2. **Run migrations**:
```bash
psql pos_test < migrations/001_create_tables.sql
```

3. **Set environment variable**:
```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_test
```

### Test Files Overview

#### `setup.ts` - Test Utilities
- **Purpose**: Provides test fixtures and helper functions
- **Contains**:
  - `TEST_DB_URL`: Test database connection string
  - `createTestDatabase()`: Helper to create test DB connection
  - `cleanupTestData()`: Helper to clean up test data between tests
  - `testFixtures`: Pre-defined test data (sales, connections, etc.)

#### `client.test.ts` - HTTP Client Tests
- **What it tests**:
  - `fetchSales()`: Fetches sales from API with correct parameters
  - `testConnection()`: Validates API credentials
  - Error handling for API failures
  - Query parameter formatting
- **Mocking**: Uses Jest to mock Axios requests

#### `mapper.test.ts` - Data Transformation Tests
- **What it tests**:
  - `toSale()`: Converts single API sale to database format
  - `toSales()`: Converts array of API sales
  - Date format conversion (ISO string → Date object)
  - ID generation (prefixes with 'sale-')
- **No mocking needed**: Pure function tests

#### `database.test.ts` - Database Operation Tests
- **What it tests**:
  - `saveSale()`: Saves sale with upsert logic
  - `saveConnection()`: Saves POS connection
  - `getConnection()`: Retrieves connection by ID
  - `updateLastSyncDate()`: Updates sync timestamp
- **Uses**: Real test database (cleaned between tests)

#### `sync.test.ts` - Sync Orchestration Tests
- **What it tests**:
  - `initialLoad()`: Complete fetch → transform → store flow
  - `dailySync()`: Yesterday's date calculation and sync
  - Error handling when individual sales fail
  - Statistics tracking (fetched, stored, errors)
- **Mocking**: Mocks client, uses real database

#### `integration.test.ts` - End-to-End Tests
- **What it tests**:
  - Complete workflow: register → initial load → daily sync
  - Integration with mock API (if available)
  - Real database operations
- **Uses**: Real database and optionally real/mock API

### Writing Tests

**Example Test Pattern**:
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', async () => {
    // Arrange: Set up test data
    // Act: Call the function
    // Assert: Check the result
  });
});
```

**Best Practices**:
- Each test should be independent
- Clean up test data between tests
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies (API, database)

---

## Usage Examples

### Example 1: Register Connection

```typescript
import { Database, POSConnection } from '@blawnt/lightspeed-connector';

const db = new Database(process.env.DATABASE_URL!);

const connection: POSConnection = {
  id: 'conn-123',
  user_id: 'user-456',
  restaurant_id: 'rest-789',
  provider: 'lightspeed',
  api_key: 'user-provided-key',
  api_secret: 'user-provided-secret',
  is_active: true,
  last_sync_date: null
};

await db.saveConnection(connection);
```

### Example 2: Initial History Load

```typescript
import { LightspeedClient, LightspeedSync, Database } from '@blawnt/lightspeed-connector';

const db = new Database(process.env.DATABASE_URL!);
const connection = await db.getConnection('conn-123');

const client = new LightspeedClient(
  'http://localhost:4020',  // Mock API or real API
  connection!.api_key
);

const sync = new LightspeedSync(client, db);

const result = await sync.initialLoad(
  connection!,
  new Date('2024-01-01'),
  new Date('2025-01-01')
);

console.log(`Fetched: ${result.fetched}, Stored: ${result.stored}`);
```

### Example 3: Daily Sync

```typescript
import { LightspeedClient, LightspeedSync, Database } from '@blawnt/lightspeed-connector';

const db = new Database(process.env.DATABASE_URL!);
const connections = await db.pool.query(
  'SELECT * FROM pos_connections WHERE is_active = true'
);

for (const conn of connections.rows) {
  const client = new LightspeedClient(process.env.API_URL!, conn.api_key);
  const sync = new LightspeedSync(client, db);
  
  await sync.dailySync(conn);
}
```

---

## Common Questions

### Q: Why separate client, mapper, and database?
**A**: Separation of concerns. Each file has one responsibility:
- `client.ts`: HTTP communication
- `mapper.ts`: Data transformation
- `database.ts`: Data persistence
- `sync.ts`: Orchestration

This makes code easier to test, understand, and modify.

### Q: Why use upsert (ON CONFLICT)?
**A**: Prevents duplicate sales if we sync the same date range multiple times. The unique constraint on `(pos_provider, pos_transaction_id)` ensures each sale is stored only once.

### Q: Why store credentials in plain text?
**A**: This is a simplified version. In production, encrypt credentials using environment variables for encryption keys. The structure supports adding encryption later.

### Q: How does daily sync work?
**A**: `dailySync()` calculates yesterday's date (00:00:00 to 00:00:00 today) and calls `initialLoad()` with that range. A cron job or scheduler calls this daily.

### Q: What if the API is down?
**A**: Currently, errors are logged and thrown. In production, add retry logic and error notifications.

---

## Next Steps for Production

1. **Encrypt credentials** in database
2. **Add pagination** handling for large date ranges
3. **Add retry logic** for failed API calls
4. **Add logging** (Winston, Pino, etc.)
5. **Add monitoring** (error tracking, metrics)
6. **Optimize batch inserts** for better performance
7. **Add webhook support** for real-time updates

---