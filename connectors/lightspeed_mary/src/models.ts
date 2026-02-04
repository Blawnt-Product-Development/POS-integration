// Store from /f/data/businesses

export interface Store {
  businessLocationId: string;
  storeName: string;
}

export interface Sale {
  receiptId: string;
  timeClosed: string;
  cancelled: boolean;
  businessLocationId: string;
}

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

export interface DailySales {
  businessLocationId: string;
  businessDate: string;
  dataComplete: boolean;
  totalSales: number | null;
}

export interface POSConnection {
  id: string;
  business_id: string;   // matches stores.businessLocationId
  api_key: string;       // matches your DB + client
  last_sync: string | null;
  active: boolean;
}