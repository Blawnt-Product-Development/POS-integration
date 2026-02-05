// connectors/lightspeed/src/client.ts
/* 
  This module provides a robust HTTP client for communicating with POS system APIs.
  It handles authentication, pagination, error handling, and request retries.
 */

import axios, { AxiosInstance } from 'axios';
/**
 * HTTP client for POS system API communication.
 * Manages authentication, request formatting, and response handling.
 */
export class LightspeedClient {
  private api: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
/**
   * Initializes the API client with configuration.
   * @param baseUrl - Base URL for the POS API
   * @param apiKey - Authentication token for API access
   */
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;

    // This creates an axios instance,  with default headers
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Fetches all stores/business locations from the POS system.
   * returns Array of store objects with IDs and names
   */

  async fetchStores() {
    //make api request to get business information
    const res: any = await axios.get(`${this.baseUrl}/f/data/businesses`, {
      headers: this.headers(),
    });
    //Extract store data from nested API response structure
    const businesses = res.data._embedded.businessList ?? [];
    const stores = [];
    //Flatten nested business/location structure into simple store objects
    for (const b of businesses) {
      for (const loc of b.businessLocations ?? []) {
        stores.push({
          blID: loc.blID,
          blName: loc.blName,
        });
      }
    }

    return stores;
  }
   /**
   * Fetches sales transactions within a date range with pagination support.
   * Handles large datasets by automatically paginating through all results.
   * 
   * @param locationId - Store identifier to fetch sales for
   * @param from - Start date for sales retrieval
   * @param to - End date for sales retrieval
   * @returns Array of all sales transactions in the date range
   */
  async fetchSales(businessLocationId: string, from: Date, to: Date) {
  const results: any[] = [];    //Accumulator for all sales records
  let nextPageToken: string | null = null;    // Token for pagination

  do {
    // Log pagination progress for debugging
    console.log("Calling /sales with:", {
      from: from.toISOString(),
      to: to.toISOString(),
      pageSize: 100,
      nextPageToken: nextPageToken ?? undefined,
    });

    //make paginated API request
    const res: any = await axios.get(
      `${this.baseUrl}/f/v2/business-location/${businessLocationId}/sales`,
      {
        headers: this.headers(),
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
          pageSize: 100,
          nextPageToken: nextPageToken ?? undefined,
        },
        timeout: 5000,
      }
    );

    console.log("Raw sales response:", JSON.stringify(res.data, null, 2));
    // Add current page results to accumulator
    results.push(...(res.data.sales ?? []));

    // Get token for next page, or null if no more pages
    nextPageToken = res.data.nextPageToken ?? null;

    // MOCK API FIX: stop infinite loop
    if (nextPageToken === "string") {
      console.log("Mock API returned fake nextPageToken 'string'. Breaking loop.");
      break;
    }

  } while (nextPageToken); //continue until no more pages

  return results;
}

/**
   * Fetches daily aggregated sales data for a specific date.
   * Used for daily synchronization and reporting.
   * 
   * @param locationId - Store identifier
   * @param date - Date in YYYY-MM-DD format
   * @returns Daily sales aggregation data
   */

async fetchDailySales(businessLocationId: string, date: string) {
  const res: any = await axios.get(
    `${this.baseUrl}/f/v2/business-location/${businessLocationId}/sales-daily`,
    {
      headers: this.headers(),
      params: { date }, // YYYY-MM-DD format
      timeout: 5000,
    }
  );

  return res.data;  //return response data
}

  /**
   * Tests API connectivity by making a simple request.
   * Used for connection validation and health checks.
   * 
   * @returns Boolean indicating whether connection is successful
   */
  
  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.api.get('/f/data/businesses');
      return true;
    } catch {
      return false;
    }
  }
}