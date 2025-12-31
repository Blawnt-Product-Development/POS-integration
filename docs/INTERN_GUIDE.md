# Intern Guide - Lightspeed Connector

## Goal
Build a simple connector that fetches sales from Lightspeed and saves to PostgreSQL.

## Steps

### Step 1: Basic Client
1. Create `client.ts` - HTTP client using axios
2. Test with mock API: `http://localhost:4020`
3. Fetch sales endpoint: `/f/v2/business-location/{id}/sales`

### Step 2: Database
1. Create `database.ts` - PostgreSQL connection
2. Write SQL migration for `sales` table
3. Implement `saveSale()` function

### Step 3: Mapper & Sync
1. Create `mapper.ts` - Convert API response to database format
2. Create `sync.ts` - Combine client + mapper + database
3. Test full flow: fetch → map → save

### Step 4: Connections & Daily Sync
1. Add `pos_connections` table
2. Implement connection saving
3. Add daily sync function
4. Test with cron job

## File Structure
- `client.ts` - Talks to Lightspeed API
- `database.ts` - Talks to PostgreSQL
- `mapper.ts` - Converts data formats
- `sync.ts` - Main logic (uses client + mapper + database)
- `models.ts` - TypeScript types