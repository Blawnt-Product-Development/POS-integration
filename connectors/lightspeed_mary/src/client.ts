// connectors/lightspeed/src/client.ts
//Simple HTTP client for Lightspeed API


//importing axios as per instructions from Intern_Guide
import axios, { AxiosInstance } from 'axios';
import { LightspeedSale } from './models';

export class LightspeedClient {
  private api: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    //This creates an axios instance, where is exactly what “HTTP client using axios” means.
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Fetch sales from Lightspeed API (original)
  // async fetchSales(
  //   businessLocationId: string,
  //   fromDate: Date,
  //   toDate: Date
  // ): Promise<LightspeedSale[]> {
  //   const response = await this.api.get(
  //     `/f/v2/business-location/${businessLocationId}/sales`,
  //     {
  //       params: {
  //         from: fromDate.toISOString(),
  //         to: toDate.toISOString(),
  //         pageSize: 100
  //       }
  //     }
  //   );

  //   return response.data.sales || [];
  // }


//   // mock testing to fetchSales (part 2)
//   async fetchSales(): Promise<any> {
//   const response = await this.api.get(
//     '/f/v2/business-location/1/sales',
//     {
//       params: {
//         from: new Date('2023-01-01').toISOString(),
//         to: new Date('2023-01-02').toISOString(),
//         pageSize: 100
//       }
//     }
//   );

//   return response.data.sales || [];
// }

 async fetchSales(
    businessLocationId: string,
    fromDate: Date,
    _toDate: Date // kept for compatibility, but ignored
  ): Promise<any[]> {
    const response = await this.api.get(
      `/f/v2/business-location/${businessLocationId}/sales`,
      {
        params: {
          from: fromDate.toISOString()
          // mock API does NOT support "to" or "pageSize"
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