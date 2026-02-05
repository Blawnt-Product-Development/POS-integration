// Store from /f/data/businesses
// This file defines what our data looks like
// It's like a blueprint for all the information we work with

// Store information - like a restaurant location
export interface Store {
  businessLocationId: string;  // Unique ID for the store
  storeName: string;          // Name of the store
}

// A single sales transaction - like a receipt
export interface Sale {
  receiptId: string;
  timeClosed: string;
  cancelled: boolean;
  businessLocationId: string;
}

// An item within a sale - like "1 coffee" on a receipt
export interface SaleLine {
  saleLineId: string;
  sku: string | null;
  name: string | null;
  quantity: number;
  menuListPrice: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  serviceCharge: number | null;
  receiptId: string;
}

// Daily summary - totals for a whole day
export interface DailySales {
  businessLocationId: string;
  businessDate: string;
  dataComplete: boolean;
  totalSales: number | null;
}

// Connection settings - how to connect to a store's API
export interface POSConnection {
  id: string;
  business_id: string;   
  api_key: string;       
  last_sync: string | null;
  active: boolean;
}