-- connectors/lightspeed/migrations/001_create_tables.sql

-- Sales table (Generic)
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(255) PRIMARY KEY,
  restaurant_id VARCHAR(255) NOT NULL,
  pos_transaction_id VARCHAR(255) NOT NULL,
  pos_provider VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  transaction_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(pos_provider, pos_transaction_id)
);

CREATE INDEX idx_sales_restaurant_date ON sales(restaurant_id, transaction_date);

-- POS Connections table (Generic)
CREATE TABLE IF NOT EXISTS pos_connections (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  restaurant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, restaurant_id, provider)
);

CREATE INDEX idx_connections_user ON pos_connections(user_id);



-- Creating tables for POS-INTEGRATION PROJECT--

 -- DROP TABLE IF EXISTS sales CASCADE; -- Note: this deletes the table in pgadmin by the table name.
 -- DROP TABLE IF EXISTS pos_connections CASCADE; -- another example of deleting a table in pgadmin.

CREATE TABLE stores (
    businessLocationId VARCHAR(50) PRIMARY KEY,
    storeName VARCHAR(255) NOT NULL
);

CREATE TABLE sales (
    receiptId VARCHAR(100) PRIMARY KEY,
    timeClosed TIMESTAMPTZ NOT NULL,
    cancelled BOOLEAN DEFAULT FALSE,
    businessLocationId VARCHAR(50) NOT NULL,
    FOREIGN KEY (businessLocationId) REFERENCES stores(businessLocationId)
);

CREATE TABLE sale_lines (
    saleLineId VARCHAR(100) PRIMARY KEY,
    sku VARCHAR(100),
    name VARCHAR(255),
    quantity INTEGER,
    menuListPrice DECIMAL(10,2),
    discountAmount DECIMAL(10,2),
    taxAmount DECIMAL(10,2),
    serviceCharge DECIMAL(10,2),
    receiptId VARCHAR(100) NOT NULL,
    FOREIGN KEY (receiptId) REFERENCES sales(receiptId)
);

-- CREATE TABLE pos_connections (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     restaurant_id VARCHAR(50) NOT NULL,
--     access_token TEXT NOT NULL,
--     refresh_token TEXT,
--     last_sync TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT now(),
--     updated_at TIMESTAMPTZ DEFAULT now()
-- );


DROP TABLE IF EXISTS pos_connections; -- new pos_connections test

CREATE TABLE pos_connections (
    id TEXT PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES stores(businessLocationId),
    api_key TEXT NOT NULL,
    last_sync TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE
);

 -- inserting a test into pos_connections

 INSERT INTO pos_connections (id, business_id, api_key, last_sync, active)
VALUES (
  'test-connection',
  '1234567890',
  'anything',
  NULL,
  TRUE
);

CREATE TABLE daily_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    businessLocationId VARCHAR(50) NOT NULL,
    businessDate DATE NOT NULL,
    dataComplete BOOLEAN DEFAULT FALSE,
    totalSales DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (businessLocationId, businessDate),
    FOREIGN KEY (businessLocationId) REFERENCES stores(businessLocationId)
);

CREATE TABLE products (
    sku VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255),
    costPrice DECIMAL(10,2),
    accountingGroup VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SALES
CREATE INDEX idx_sales_store ON sales(businessLocationId);
CREATE INDEX idx_sales_time ON sales(timeClosed);

-- SALE_LINES
CREATE INDEX idx_sale_lines_receipt ON sale_lines(receiptId);
CREATE INDEX idx_sale_lines_sku ON sale_lines(sku);

-- DAILY_SALES
CREATE INDEX idx_daily_sales_store_date 
ON daily_sales(businessLocationId, businessDate);

-- PRODUCTS (optional)
CREATE INDEX idx_products_group ON products(accountingGroup);

-- POS_CONNECTIONS
CREATE INDEX idx_connections_business ON pos_connections(business_id);

/*
NOTES (What I learned): 
To optimize query performance in the Lightspeed POS data pipeline,
I added targeted database indexes to frequently queried columns.
Indexes allow PostgreSQL to locate rows quickly without scanning entire tables,
which significantly improves speed for operations such as:

- Retrieving sales by store and date
- Joining sales with line‑item details
- Running incremental daily syncs
- Looking up POS connection records
These indexes ensure the pipeline remains efficient and scalable as data volume increases.
*/

