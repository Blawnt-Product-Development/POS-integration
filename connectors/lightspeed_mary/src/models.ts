
//Changed models.ts from part 4 of intern guide.
// connectors/lightspeed/src/models.ts
// Store from /f/data/businesses
export interface Store {
  businessLocationId: string;
  storeName: string;
}

// Sale from /sales
export interface Sale {
  receiptId: string;
  timeClosed: string;
  cancelled: boolean;
  businessLocationId: string;
}

// Sale line from /sales
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

// Daily sales from /sales-daily
export interface DailySales {
  businessLocationId: string;
  businessDate: string;
  dataComplete: boolean;
  totalSales: number | null;
}

// POS connection
export interface POSConnection {
  id: string;
  store_id: string;     // businessLocationId
  access_token: string;
  refresh_token: string | null;
  last_sync: string | null;
}