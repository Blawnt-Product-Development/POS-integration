-- connectors/lightspeed/migrations/001_create_tables.sql

-- Sales table
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

-- POS Connections table
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