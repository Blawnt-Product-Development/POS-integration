// connectors/lightspeed/src/models.ts
// TypeScript types/interfaces


// What we get from Lightspeed API
export interface LightspeedSale {
    id: string;
    total: number;
    dateTime: string;
    locationId: string;
    // ... other fields from API
  }
  
  // What we store in our database
  export interface Sale {
    id: string;
    restaurant_id: string;
    pos_transaction_id: string;
    pos_provider: string;
    total_amount: number;
    currency: string;
    transaction_date: Date;
  }
  
  // POS Connection (credentials)
  export interface POSConnection {
    id: string;
    user_id: string;
    restaurant_id: string;
    provider: string;
    api_key: string;        // Encrypted in real app, plain for now
    api_secret: string;     // Encrypted in real app, plain for now
    is_active: boolean;
    last_sync_date: Date | null;
  }