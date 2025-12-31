// connectors/lightspeed/src/client.ts
//Simple HTTP client for Lightspeed API

import axios, { AxiosInstance } from 'axios';
import { LightspeedSale } from './models';

export class LightspeedClient {
  private api: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Fetch sales from Lightspeed API
  async fetchSales(
    businessLocationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<LightspeedSale[]> {
    const response = await this.api.get(
      `/f/v2/business-location/${businessLocationId}/sales`,
      {
        params: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          pageSize: 100
        }
      }
    );

    return response.data.sales || [];
  }

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