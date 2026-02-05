// src/database.ts
// Database operations for Lightspeed POS
// This file is like a librarian 
// it knows how to store and find data in the database

import dotenv from "dotenv";
dotenv.config();
// PostgreSQL connection pool
import { Pool } from "pg";
import { Store, Sale, SaleLine, DailySales, POSConnection } from "./models";

// Main database class - handles all database operations
export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  // ---------------- STORES ----------------
  // Save or update a store in the database
  async saveStore(store: Store): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO stores (businessLocationId, storeName)
      VALUES ($1, $2)
      ON CONFLICT (businessLocationId)
      DO UPDATE SET storeName = EXCLUDED.storeName
      `,
      [store.businessLocationId, store.storeName]
    );
  }

  // ---------------- SALES ----------------
  // Save or update a sale transaction
  async saveSale(sale: Sale): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO sales (receiptId, timeClosed, cancelled, businessLocationId)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (receiptId)
      DO UPDATE SET
        timeClosed = EXCLUDED.timeClosed,
        cancelled = EXCLUDED.cancelled
      `,
      [
        sale.receiptId,
        sale.timeClosed,
        sale.cancelled,
        sale.businessLocationId,
      ]
    );
  }

  // ---------------- SALE LINES ----------------
 async saveSaleLine(line: SaleLine): Promise<void> {
  // Generate fallback saleLineId if missing (mock API issue)
  // Sometimes test data doesn't have IDs, so we make one up
  const saleLineId =
    line.saleLineId ??
    `${line.receiptId}-${line.sku}-${Math.random().toString(36).slice(2, 8)}`;

  // Normalize numeric fields
   // Some APIs send numbers as strings, so we convert them
  const quantity = parseFloat(String(line.quantity ?? "0"));
  const menuListPrice = parseFloat(String(line.menuListPrice ?? "0"));
  const discountAmount = parseFloat(String(line.discountAmount ?? "0"));
  const taxAmount = parseFloat(String(line.taxAmount ?? "0"));
  const serviceCharge = parseFloat(String(line.serviceCharge ?? "0"));

  await this.pool.query(
    `
    INSERT INTO sale_lines (
      saleLineId, sku, name, quantity,
      menuListPrice, discountAmount, taxAmount, serviceCharge,
      receiptId
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (saleLineId)
    DO UPDATE SET
      quantity = EXCLUDED.quantity,
      menuListPrice = EXCLUDED.menuListPrice,
      discountAmount = EXCLUDED.discountAmount,
      taxAmount = EXCLUDED.taxAmount,
      serviceCharge = EXCLUDED.serviceCharge
    `,
    [
      saleLineId,
      line.sku,
      line.name,
      quantity,
      menuListPrice,
      discountAmount,
      taxAmount,
      serviceCharge,
      line.receiptId,
    ]
  );
}

  // ---------------- DAILY SALES ----------------
    // Save daily summary data
  async saveDailySales(d: DailySales): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO daily_sales (
        businessLocationId, businessDate, dataComplete, totalSales
      )
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (businessLocationId, businessDate)
      DO UPDATE SET
        dataComplete = EXCLUDED.dataComplete,
        totalSales = EXCLUDED.totalSales,
        updated_at = now()
      `,
      [
        d.businessLocationId,
        d.businessDate,
        d.dataComplete,
        d.totalSales,
      ]
    );
  }

  // ---------------- STORES (READ) ----------------
  // Get all stores from database
    async getStores() {
    const result = await this.pool.query(
      `
      SELECT 
        businessLocationId AS "businessLocationId",
        storeName AS "storeName"
      FROM stores
      `
    );
    // returns the store data
    return result.rows;
  }

  // ---------------- DAILY SALES (READ) ----------------
  // Get daily sales for a specific store and date
  async getDailySales(businessLocationId: string, businessDate: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM daily_sales
      WHERE businessLocationId = $1
        AND businessDate = $2
      `,
      [businessLocationId, businessDate]
    );
    return result.rows;
  }
    // Get the last time we synced data for a connection
  async getLastSyncDate(connectionId: string): Promise<Date | null> {
  const result = await this.pool.query(
    `SELECT last_sync FROM pos_connections WHERE id = $1`,
    [connectionId]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].last_sync;
  }




  // ---------------- POS CONNECTIONS (FIXED) ----------------
    // Save or update a connection configuration
  async saveConnection(conn: POSConnection): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO pos_connections (
        id, business_id, api_key, last_sync, active
      )
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (id)
      DO UPDATE SET
        business_id = EXCLUDED.business_id,
        api_key = EXCLUDED.api_key,
        last_sync = EXCLUDED.last_sync,
        active = EXCLUDED.active
      `,
      [
        conn.id,
        conn.business_id,
        conn.api_key,
        conn.last_sync,
        conn.active,
      ]
    );
  }
  
  // Get all active connections (ones that are turned on)
  async getActiveConnections(): Promise<POSConnection[]> {
    const result = await this.pool.query(
      `SELECT * FROM pos_connections WHERE active = TRUE`
    );
    return result.rows as POSConnection[];
  }
  
  // Update when we last synced data for a connection
  async updateLastSyncDate(id: string, date: string): Promise<void> {
    await this.pool.query(
      `UPDATE pos_connections SET last_sync = $1 WHERE id = $2`,
      [date, id]
    );
  }
}