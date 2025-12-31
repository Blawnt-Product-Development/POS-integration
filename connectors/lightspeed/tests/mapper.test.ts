// connectors/lightspeed/tests/mapper.test.ts
// Tests for LightspeedMapper

import { LightspeedMapper } from '../src/mapper';
import { LightspeedSale, Sale } from '../src/models';

describe('LightspeedMapper', () => {
  describe('toSale', () => {
    it('should convert LightspeedSale to Sale correctly', () => {
      const apiSale: LightspeedSale = {
        id: 'ls-123',
        total: 150.75,
        dateTime: '2025-01-15T14:30:00Z',
        locationId: 'rest-456'
      };

      const result = LightspeedMapper.toSale(apiSale, 'rest-456');

      expect(result).toEqual({
        id: 'sale-ls-123',
        restaurant_id: 'rest-456',
        pos_transaction_id: 'ls-123',
        pos_provider: 'lightspeed',
        total_amount: 150.75,
        currency: 'USD',
        transaction_date: new Date('2025-01-15T14:30:00Z')
      });
    });

    it('should handle different date formats', () => {
      const apiSale: LightspeedSale = {
        id: 'ls-456',
        total: 99.99,
        dateTime: '2025-12-31T23:59:59Z',
        locationId: 'rest-789'
      };

      const result = LightspeedMapper.toSale(apiSale, 'rest-789');
      
      expect(result.transaction_date).toBeInstanceOf(Date);
      expect(result.transaction_date.toISOString()).toBe('2025-12-31T23:59:59.000Z');
    });
  });

  describe('toSales', () => {
    it('should convert array of LightspeedSales to Sales', () => {
      const apiSales: LightspeedSale[] = [
        {
          id: 'ls-1',
          total: 100,
          dateTime: '2025-01-15T10:00:00Z',
          locationId: 'rest-123'
        },
        {
          id: 'ls-2',
          total: 200,
          dateTime: '2025-01-15T11:00:00Z',
          locationId: 'rest-123'
        }
      ];

      const result = LightspeedMapper.toSales(apiSales, 'rest-123');

      expect(result).toHaveLength(2);
      expect(result[0].pos_transaction_id).toBe('ls-1');
      expect(result[1].pos_transaction_id).toBe('ls-2');
      expect(result[0].restaurant_id).toBe('rest-123');
      expect(result[1].restaurant_id).toBe('rest-123');
    });

    it('should handle empty array', () => {
      const result = LightspeedMapper.toSales([], 'rest-123');
      expect(result).toEqual([]);
    });
  });
});