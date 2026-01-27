// connectors/lightspeed/src/database.ts
// Database operations for Lightspeed POS

import dotenv from "dotenv"; //added this because of an issue..
dotenv.config(); //added this
import { Pool } from "pg";
import { Store, Sale, SaleLine, DailySales, POSConnection } from "./models";

export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  // ---------------- STORES ----------------
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
        line.saleLineId,
        line.sku,
        line.name,
        line.quantity,
        line.menuListPrice,
        line.discountAmount,
        line.taxAmount,
        line.serviceCharge,
        line.receiptId,
      ]
    );
  }

  // ---------------- DAILY SALES ----------------
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

  // ---------------- POS CONNECTIONS ----------------
  async saveConnection(conn: POSConnection): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO pos_connections (
        id, store_id, access_token, refresh_token, last_sync
      )
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (store_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        last_sync = EXCLUDED.last_sync,
        updated_at = now()
      `,
      [
        conn.id,
        conn.store_id,
        conn.access_token,
        conn.refresh_token,
        conn.last_sync,
      ]
    );
  }

  async getActiveConnections(): Promise<POSConnection[]> {
    const result = await this.pool.query(`SELECT * FROM pos_connections`);
    return result.rows as POSConnection[];
  }

  async updateLastSyncDate(id: string, date: string): Promise<void> {
    await this.pool.query(
      `UPDATE pos_connections SET last_sync = $1, updated_at = now() WHERE id = $2`,
      [date, id]
    );
  }
}