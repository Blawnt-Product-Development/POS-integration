// connectors/lightspeed/tests/client.test.ts
// Tests for LightspeedClient

import { LightspeedClient } from '../src/client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LightspeedClient', () => {
  let client: LightspeedClient;
  const baseUrl = 'http://localhost:4020';
  const apiKey = 'test-api-key';

  beforeEach(() => {
    client = new LightspeedClient(baseUrl, apiKey);
    jest.clearAllMocks();
  });

  describe('fetchSales', () => {
    it('should fetch sales from API successfully', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          total: 100.50,
          dateTime: '2025-01-15T10:00:00Z',
          locationId: 'rest-123'
        },
        {
          id: 'sale-2',
          total: 200.75,
          dateTime: '2025-01-15T11:00:00Z',
          locationId: 'rest-123'
        }
      ];

      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: { sales: mockSales }
        })
      })) as any;

      const fromDate = new Date('2025-01-15');
      const toDate = new Date('2025-01-16');
      
      // Recreate client to use mocked axios
      const testClient = new LightspeedClient(baseUrl, apiKey);
      const api = (testClient as any).api;
      api.get = jest.fn().mockResolvedValue({ data: { sales: mockSales } });

      const sales = await testClient.fetchSales('rest-123', fromDate, toDate);

      expect(sales).toHaveLength(2);
      expect(sales[0].id).toBe('sale-1');
      expect(sales[0].total).toBe(100.50);
    });

    it('should handle empty sales response', async () => {
      const testClient = new LightspeedClient(baseUrl, apiKey);
      const api = (testClient as any).api;
      api.get = jest.fn().mockResolvedValue({ data: { sales: [] } });

      const sales = await testClient.fetchSales('rest-123', new Date(), new Date());
      
      expect(sales).toEqual([]);
    });

    it('should include correct query parameters', async () => {
      const testClient = new LightspeedClient(baseUrl, apiKey);
      const api = (testClient as any).api;
      const mockGet = jest.fn().mockResolvedValue({ data: { sales: [] } });
      api.get = mockGet;

      const fromDate = new Date('2025-01-01T00:00:00Z');
      const toDate = new Date('2025-01-31T23:59:59Z');

      await testClient.fetchSales('rest-123', fromDate, toDate);

      expect(mockGet).toHaveBeenCalledWith(
        '/f/v2/business-location/rest-123/sales',
        {
          params: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            pageSize: 100
          }
        }
      );
    });
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      const testClient = new LightspeedClient(baseUrl, apiKey);
      const api = (testClient as any).api;
      api.get = jest.fn().mockResolvedValue({ data: {} });

      const result = await testClient.testConnection();
      
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      const testClient = new LightspeedClient(baseUrl, apiKey);
      const api = (testClient as any).api;
      api.get = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await testClient.testConnection();
      
      expect(result).toBe(false);
    });
  });
});