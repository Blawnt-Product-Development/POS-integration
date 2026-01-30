// connectors/lightspeed/src/client.ts
// Simple HTTP client for Lightspeed API

// importing axios as per instructions from Intern_Guide
import axios, { AxiosInstance } from 'axios';

export class LightspeedClient {
  private api: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;

    // This creates an axios instance, which is exactly what “HTTP client using axios” means.
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Helper for headers (used by axios.get calls below)
  private headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
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
  //
  //   return response.data.sales || [];
  // }

  // mock testing to fetchSales (part 2)
  // async fetchSales(): Promise<any> {
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
  //
  //   return response.data.sales || [];
  // }

  async fetchStores() {
    const res: any = await axios.get(`${this.baseUrl}/f/data/businesses`, {
      headers: this.headers(),
    });

    const businesses = res.data._embedded.businessList ?? [];
    const stores = [];

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

  async fetchSales(businessLocationId: string, from: Date, to: Date) {
  const results: any[] = [];
  let nextPageToken: string | null = null;

  do {
    console.log("Calling /sales with:", {
      from: from.toISOString(),
      to: to.toISOString(),
      pageSize: 100,
      nextPageToken: nextPageToken ?? undefined,
    });

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
    //testing..
    console.log("Raw sales response:", JSON.stringify(res.data, null, 2));

    results.push(...(res.data.sales ?? []));
    nextPageToken = res.data.nextPageToken ?? null;

    // MOCK API FIX: stop infinite loop
    if (nextPageToken === "string") {
      console.log("Mock API returned fake nextPageToken 'string'. Breaking loop.");
      break;
    }

  } while (nextPageToken);

  return results;
}

async fetchDailySales(businessLocationId: string, date: string) {
  const res: any = await axios.get(
    `${this.baseUrl}/f/v2/business-location/${businessLocationId}/sales-daily`,
    {
      headers: this.headers(),
      params: { date }, // already YYYY-MM-DD
      timeout: 5000,
    }
  );

  return res.data;
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