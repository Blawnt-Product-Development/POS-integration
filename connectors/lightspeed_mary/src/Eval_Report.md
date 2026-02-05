POS Integration System - Technical Implementation Report
Executive Summary

System Architecture
text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API       │────▶│   Sync      │────▶│  Database   │
│   Client    │     │   Engine    │     │   Layer     │
│  (client.ts)│     │  (sync.ts)  │     │(database.ts)│
└─────────────┘     └─────────────┘     └─────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  External   │     │   Data      │     │ PostgreSQL  │
│   POS API   │     │   Mapper    │     │   Tables    │
│             │     │ (mapper.ts) │     │             │
└─────────────┘     └─────────────┘     └─────────────┘

POS Integration System - Technical Implementation Report
Executive Summary
I designed and implemented a complete Point of Sale integration system that automates sales data synchronization between restaurant POS systems and a PostgreSQL database. The system solves manual data entry problems by providing reliable, automated daily synchronization for analytics and reporting.

What I Delivered:
I built a TypeScript-based integration system with 17 working files. I implemented three sync types: daily, incremental, and historical data loading. I created error handling that recovers from network failures and API errors. I built diagnostic tools that test API connectivity and data integrity. I delivered code that runs scheduled syncs automatically via cron jobs.

System Architecture
The system follows a clean three-layer architecture. The API Client layer (client.ts) communicates with external POS systems. The Sync Engine layer (sync.ts) orchestrates all synchronization workflows. The Database layer (database.ts) manages all PostgreSQL operations. Each layer has specific responsibilities and clear interfaces between them.

File-by-File Implementation Details
models.ts - Data Structure Contracts
I built TypeScript interfaces that define every data shape in the system. This file contains the Store interface with businessLocationId and storeName fields, the Sale interface with receiptId, timeClosed, cancelled status, and store reference, the SaleLine interface with individual items including SKU, quantity, pricing, and tax details, and the DailySales interface for aggregated daily totals with data completeness flag. I also created the POSConnection interface for API authentication and sync tracking configuration.

My implementation approach was to create interfaces first, before any database tables, to ensure type safety across the entire codebase. This prevented many runtime errors and made the code more maintainable.

mapper.ts - Data Transformation Engine
I built conversion logic that translates API responses into database-ready objects. The toSales() method extracts receipt data from nested API responses, while the toSaleLines() method flattens line items from within sales objects. The mapper handles missing data with default values (like cancelled ?? false) and preserves relationships between sales and their line items.

The specific challenge I solved was handling the POS API's deeply nested JSON where line items are buried inside sales objects. My mapper extracts and normalizes this data into a flat structure suitable for database storage and analysis.

sync.ts - Workflow Orchestrator
I built the central coordination engine that manages all synchronization operations. I implemented three sync strategies: Daily Sync that fetches yesterday's sales data at 2 AM automatically, Incremental Sync that uses "watermark" timestamps to fetch only new data since last sync, and Historical Load that backfills months of sales data when first connecting a store.

A key feature is error isolation - if one store's sync fails, others continue processing. My code retrieves active connections from the pos_connections table, calls the appropriate API endpoints for each connection, transforms data using the mapper, saves to database with conflict resolution, and updates sync timestamps for incremental tracking.

database.ts - PostgreSQL Operations Layer
I built a database abstraction that handles all PostgreSQL interactions. My implementation uses the pg library with connection pooling for performance, implements upsert logic (ON CONFLICT DO UPDATE) to prevent duplicates, handles numeric conversion (since the API sometimes sends numbers as strings), and manages database indexes for query optimization.

I wrote specific SQL patterns like the upsert pattern for sales that prevents duplicate receipt IDs while allowing updates to timestamps and cancellation status. I also created a similar pattern for daily summaries that maintains unique daily records per store.

client.ts - API Communication Handler
I built an HTTP client that manages all POS API interactions. My implementation includes Bearer token authentication in headers, pagination handling for large datasets (100 records per page), timeout configuration (5-10 seconds depending on endpoint), and connection testing with the /f/data/businesses endpoint.

The pagination logic I wrote handles the POS API's continuation token system. A problem I solved was the mock API sometimes returning "string" as a fake token, which would cause infinite loops. I added a specific check to break the loop when this happens.

test-db.ts - Connectivity Validator
I built a simple diagnostic tool that tests database connections. My implementation is a single-function script that attempts a database connection and reports success or failure with specific error messages. This became my first troubleshooting step whenever something wasn't working.

Supporting Files I Created
create-connection.ts
This saves test connection configurations to the database. My code creates a connection with business_id and api_key for testing purposes.

cron.ts
This sets up scheduled daily syncs. My code can run in test mode (immediate execution) or scheduled mode (2 AM daily via cron), making it flexible for both development and production use.

debug.ts
This provides comprehensive system diagnostics. My code tests API connectivity, daily sales endpoints, and historical data fetching for all stores. This became my go-to tool when things weren't working as expected.

fetch-daily-sales.ts
This enables manual testing of daily sales synchronization. My code fetches yesterday's data for all stores, checks the dataComplete flag, and saves to the database if the data is complete.

fetch-stores.ts
This handles initial store discovery and saving. My code calls the /f/data/businesses endpoint, extracts store information, and saves it to the stores table.

run-daily-sync.ts & run-incremental-sync.ts
These provide command-line interfaces for manual sync execution. They are wrappers around the sync engine for manual operation when needed.

test-full-flow.ts & sales.ts
These support integration testing of complete workflows. My code tests historical data loading with specific date ranges and validates the entire data pipeline.

watermark-sync.ts
This implements specialized incremental sync functionality. My code implements watermark-based synchronization that only fetches new data since the last successful sync.

Architecture Patterns I Implemented
Repository Pattern in database.ts
I abstracted all database operations behind a clean Database class. This centralizes SQL queries in one place, makes database technology swappable, provides consistent error handling, and manages connection pooling automatically.

Adapter Pattern in mapper.ts
I created adapters that convert between API and database formats. This isolates API-specific data structures, provides a clean interface for the sync engine, handles data normalization and default values, and makes the system adaptable to different POS APIs.

Strategy Pattern in sync.ts
I implemented multiple sync strategies (daily, incremental, historical). This allows different sync approaches for different scenarios, makes adding new sync types straightforward, isolates strategy-specific logic, and provides clear entry points for each sync type.

Factory Pattern in Client Creation
The system creates configured API clients based on connection data. This centralizes client configuration, ensures consistent authentication, makes testing with mock clients possible, and manages client lifecycle properly.

Technical Challenges I Solved
1. Pagination with Token Continuation
Problem: The POS API returns data in pages with a nextPageToken. I needed to fetch all pages without missing data or creating infinite loops.

My solution: I implemented a do-while loop that continues until nextPageToken is null, with logging for debugging and a safety check for mock API tokens.

2. Data Normalization for Inconsistent APIs
Problem: The mock API sometimes sends numbers as strings ("10.50" instead of 10.50).

My solution: I added explicit parsing in database.ts to convert string numbers to proper numeric types before database insertion.

3. Missing Primary Keys in Test Data
Problem: Mock API responses sometimes lack saleLineId for line items.

My solution: I generated fallback IDs in database.ts using a combination of receipt ID, SKU, and random string to ensure every line item has a unique identifier.

4. Watermark Tracking for Incremental Syncs
Problem: Daily syncs re-fetch all yesterday's data, which is inefficient.

My solution: I implemented watermark-based sync that stores last_sync timestamp for each connection, only fetches sales with timeClosed after the watermark, updates watermark to the newest sale timestamp, and falls back to yesterday if no watermark exists.

5. Database Performance with Large Datasets
Problem: Saving thousands of records was slow.

My solution: I added database indexes in my SQL migrations to optimize query performance for common access patterns.

How the System Components Interact
Daily Sync Sequence:
cron.ts executes at scheduled time, calls sync.runDailySync(), which gets active connections from database.ts. For each connection, it calls client.fetchDailySales(), transforms the response with mapper.toSales() and mapper.toSaleLines(), saves to database with database.saveSale() and database.saveSaleLine(), and updates daily summary with database.saveDailySales().

Data Transformation Pipeline:
API JSON → mapper.ts → TypeScript Objects → database.ts → PostgreSQL Rows

Error Handling Chain:
API Error → client.ts logs → sync.ts catches → continues other stores → debug.ts can diagnose

My Learning Outcomes
TypeScript in Production
I learned how TypeScript interfaces prevent runtime errors. My models.ts file served as both documentation and type checking. When I tried to assign a string to a number field, TypeScript caught it immediately.

Real API Integration Patterns
Working with the mock API taught me about pagination implementation with continuation tokens, authentication header management, response structure validation, timeout and retry configuration, and mock data handling for development.

Database Design Decisions
I made specific choices in my SQL schema: used businessLocationId as foreign key throughout, created composite unique constraints (businessLocationId, businessDate), implemented upsert logic to handle re-syncs, added proper indexing based on query patterns, and used TIMESTAMPTZ for timezone-aware timestamps.

Error Recovery Strategies
I implemented multiple error handling approaches: try-catch blocks around API calls, continue-on-error for multi-store processing, logging with context for debugging, fallback values for missing data, and connection testing before full syncs.

System Testing Approach
I built a comprehensive testing suite: test-db.ts for database connectivity, debug.ts for full system diagnostics, sales.ts for historical data, test-full-flow.ts for end-to-end validation, and manual CLI tools for specific scenarios.

Code Quality Practices I Applied
Consistent Error Handling
Every async function includes try-catch blocks. Database operations include conflict resolution. API calls have timeout protection.

Comprehensive Logging
I added console logging at key points: when syncs start/end, when pagination continues, when data completeness checks fail.

Environment Configuration
All sensitive data (URLs, API keys, database credentials) comes from environment variables, not hardcoded values.

Modular Design
Each file has a single responsibility. client.ts only handles API communication. database.ts only handles database operations. sync.ts orchestrates without doing the work itself.

Practical Comments
I added comments explaining why code exists, not just what it does. For example: "Mock API FIX: stop infinite loop" explains the purpose of checking for nextPageToken === "string".

Demonstration Instructions
Setup Steps I Would Follow:
Run npm install to install dependencies

Set up PostgreSQL with my 001_create_tables.sql schema

Configure .env file with database URL and API settings

Run node dist/create-connection.js to create test connection

Run node dist/fetch-stores.js to discover stores

Run node dist/test-db.js to verify connectivity

Run node dist/debug.js for full system check

Schedule node dist/cron.js for automated daily syncs

Test Execution Sequence:
 - powershell terminal
# 1. Fetch stores (businesses endpoint)
npx ts-node src/fetch-stores.ts

# 2. Initial Load (sales endpoint with pagination)
npx ts-node src/sales.ts

# 3. Daily Sales Fetch (single endpoint test)
npx ts-node src/fetch-daily-sales.ts

# 4. Daily Sync (complete daily workflow)
npx ts-node src/run-daily-sync.ts

# 5. Incremental Sync (watermark system test)
npx ts-node src/watermark-sync.ts

# 6. Incremental Sync Runner (full incremental workflow)
npx ts-node src/run-incremental-sync.ts

# 7. Testing cron timer (scheduling validation)
npx ts-node src/cron.ts

What This System Demonstrates
Technical Competencies:
TypeScript interface design and implementation, PostgreSQL schema design and optimization, REST API integration with authentication, error handling and recovery strategies, scheduled task execution, database performance optimization, and system testing and diagnostics.

Software Engineering Practices:
Modular architecture with clear separation of concerns, comprehensive error handling at multiple levels, environment-based configuration management, logging for operational visibility, database migration management, API client abstraction, and data transformation pipelines.

Problem-Solving Approaches:
Incremental development following the intern guide, testing each component independently before integration, building diagnostics alongside features, handling edge cases from real API behavior, optimizing based on performance observations, and documenting decisions and trade-offs.

Project Evolution
I developed this system in stages, following the intern guide. I started with Basic Client: client.ts to connect to mock API. Then I added Database Layer: database.ts with PostgreSQL operations. Next came Data Transformation: mapper.ts to convert API responses. I built the Sync Engine: sync.ts to orchestrate workflows. I added Connection Management: create-connection.ts and connection table. I implemented Scheduling: cron.ts for automated execution. I built Testing: comprehensive test and diagnostic utilities. Finally, I added Optimization: indexes, watermarks, and performance improvements.

Each stage built on the previous one, with testing at each step to ensure correctness.

Developer: Mary Penta Reddy
Implementation Period: December 15, 2025 - January 6th, 2026
Technology Stack: TypeScript, Node.js, PostgreSQL, Axios
File Count: 17 TypeScript files + SQL migrations
Key Features: Daily syncs, incremental updates, historical loading, error recovery, diagnostics