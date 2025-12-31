# Lightspeed Connector

Simple connector to fetch sales data from Lightspeed POS and store in PostgreSQL.

## Quick Start

### Prerequisites

- Node.js v20+
- PostgreSQL database
- Docker (for running mock API)

### Installation

```bash
npm install
```

### Setup Database

1. **Create database**:
```bash
createdb pos_integration
```

2. **Run migrations**:
```bash
psql pos_integration < migrations/001_create_tables.sql
```

3. **Set environment variable**:
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_integration
```

Or create a `.env` file (see `.env.example`).

### Setup Mock API (for testing)

From the repository root:

```bash
docker compose -f pos-integration-mocks/mocks/lightspeed/docker-compose.yml up
```

The mock API will be available at `http://localhost:4020`.

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## Usage

### 1. Register a POS Connection

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

### 2. Initial History Load

```typescript
import { LightspeedClient, LightspeedSync, Database } from '@blawnt/lightspeed-connector';

const db = new Database(process.env.DATABASE_URL!);
const connection = await db.getConnection('conn-123');

const client = new LightspeedClient(
  process.env.LIGHTSPEED_API_URL || 'http://localhost:4020',
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

### 3. Daily Sync

```typescript
import { LightspeedClient, LightspeedSync, Database } from '@blawnt/lightspeed-connector';

const db = new Database(process.env.DATABASE_URL!);
const connections = await db.getActiveConnections();

for (const conn of connections) {
  const client = new LightspeedClient(process.env.LIGHTSPEED_API_URL!, conn.api_key);
  const sync = new LightspeedSync(client, db);
  
  await sync.dailySync(conn);
}
```

See `examples/` folder for complete examples.

## Project Structure

```
connectors/lightspeed/
├── src/
│   ├── models.ts          # TypeScript interfaces
│   ├── client.ts          # HTTP client for Lightspeed API
│   ├── mapper.ts          # Data transformation
│   ├── database.ts        # PostgreSQL operations
│   ├── sync.ts            # Main sync orchestration
│   └── index.ts           # Public exports
├── tests/                 # Test files
├── migrations/            # Database migrations
├── TECH_DOC.md           # Detailed technical documentation
└── README.md             # This file
```

## Documentation

- **[TECH_DOC.md](./TECH_DOC.md)** - Complete technical documentation
- **[Intern Guide](../../docs/INTERN_GUIDE.md)** - Step-by-step guide for developers

## Testing

Tests require a test database. Set up:

```bash
createdb pos_test
psql pos_test < migrations/001_create_tables.sql
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_test
```

Then run:
```bash
npm test
```

## Environment Variables

See `.env.example` for required environment variables.

## License

Internal use only.

