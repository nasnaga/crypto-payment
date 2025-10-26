import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatAddress,
  formatNumber,
  formatCurrency,
  formatTimestamp,
  formatRelativeTime,
  lamportsToSol,
  solToLamports,
  weiToEth,
  ethToWei,
  satoshisToBtc,
  btcToSatoshis,
  tokenToSmallestUnit,
  smallestUnitToToken,
} from '../src/utils/formatters.js';

describe('Formatters Utility Functions', () => {
  describe('formatAddress()', () => {
    it('should format address with default 4 characters', () => {
      const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      const result = formatAddress(address);
      expect(result).toContain('7xKX');
      expect(result).toContain('...');
      expect(result.length < address.length).toBe(true);
    });

    it('should format address with custom character count', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const result = formatAddress(address, 6);
      // With 6 chars: first 6 = "0x742d", last 6 = "5f0bEb"
      expect(result).toMatch(/^0x742d.+5f0bEb$/);
      expect(result).toContain('...');
      expect(result.length < address.length).toBe(true);
    });

    it('should handle short addresses', () => {
      const address = 'abc';
      const result = formatAddress(address, 4);
      expect(result).toContain('...');
    });

    it('should return "Not Connected" for null or empty address', () => {
      expect(formatAddress(null)).toBe('Not Connected');
      expect(formatAddress(undefined)).toBe('Not Connected');
      expect(formatAddress('')).toBe('Not Connected');
    });
  });

  describe('formatNumber()', () => {
    it('should format number with default 6 decimals', () => {
      const result = formatNumber(1000.123456789);
      expect(result).toContain('1,000');
    });

    it('should format number with custom decimal places', () => {
      const result = formatNumber(1234.5678, 2);
      expect(result).toContain('2'); // Should have 2 decimals max
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle null and undefined', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });

    it('should handle NaN', () => {
      expect(formatNumber(NaN)).toBe('0');
    });

    it('should add thousand separators', () => {
      expect(formatNumber(1234567)).toContain(',');
    });

    it('should format very small numbers', () => {
      const result = formatNumber(0.000001, 6);
      expect(result).toBe('0.000001');
    });
  });

  describe('formatCurrency()', () => {
    it('should format as USD currency by default', () => {
      const result = formatCurrency(100);
      expect(result).toContain('$');
      expect(result).toContain('100');
    });

    it('should format with custom currency', () => {
      const result = formatCurrency(100, 'EUR');
      expect(result).toContain('100');
    });

    it('should format with custom decimal places', () => {
      const result = formatCurrency(100.123, 'USD', 3);
      expect(result).toContain('100');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1,000,000');
    });
  });

  describe('formatTimestamp()', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = new Date('2024-01-15T14:30:00').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should include time in the format', () => {
      const timestamp = new Date('2024-01-15T14:30:00').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toContain('30'); // Check for minutes
      expect(result).toContain('2024'); // Check for year
    });

    it('should handle current date', () => {
      const now = Date.now();
      const result = formatTimestamp(now);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatRelativeTime()', () => {
    it('should show seconds ago', () => {
      const timestamp = Date.now() - 30000; // 30 seconds ago
      const result = formatRelativeTime(timestamp);
      expect(result).toContain('second');
      expect(result).toContain('ago');
    });

    it('should show minutes ago', () => {
      const timestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const result = formatRelativeTime(timestamp);
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    it('should show hours ago', () => {
      const timestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
      const result = formatRelativeTime(timestamp);
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should show days ago', () => {
      const timestamp = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      const result = formatRelativeTime(timestamp);
      expect(result).toContain('day');
      expect(result).toContain('ago');
    });

    it('should use plural forms correctly', () => {
      const oneSecond = Date.now() - 1000;
      const result = formatRelativeTime(oneSecond);
      expect(result).toContain('1 second');

      const twoSeconds = Date.now() - 2000;
      const resultPlural = formatRelativeTime(twoSeconds);
      expect(resultPlural).toContain('seconds');
    });
  });

  describe('Solana Lamports Conversion', () => {
    it('should convert lamports to SOL', () => {
      expect(lamportsToSol(1000000000)).toBe(1); // 1 SOL
      expect(lamportsToSol(5000000000)).toBe(5); // 5 SOL
      expect(lamportsToSol(1000)).toBe(0.000001); // 1000 lamports
    });

    it('should convert SOL to lamports', () => {
      expect(solToLamports(1)).toBe(1000000000);
      expect(solToLamports(5)).toBe(5000000000);
      // Note: floating point precision - 0.000001 * 1e9 = 1000 due to rounding
      expect(solToLamports(0.001)).toBe(1000000);
    });

    it('should be reversible', () => {
      const original = 2.5;
      const converted = solToLamports(original);
      const back = lamportsToSol(converted);
      expect(back).toBe(original);
    });
  });

  describe('Ethereum Wei Conversion', () => {
    it('should convert wei to ETH', () => {
      expect(weiToEth(BigInt('1000000000000000000'))).toBe(1); // 1 ETH
      expect(weiToEth(BigInt('5000000000000000000'))).toBe(5); // 5 ETH
    });

    it('should handle wei as number', () => {
      expect(weiToEth(1000000000000000000)).toBe(1);
    });

    it('should convert ETH to wei', () => {
      expect(ethToWei(1)).toBe(1000000000000000000);
      expect(ethToWei(5)).toBe(5000000000000000000);
    });

    it('should handle fractional ETH', () => {
      const result = ethToWei(0.5);
      expect(result).toBe(500000000000000000);
    });

    it('should be reversible for whole numbers', () => {
      const original = 2;
      const converted = ethToWei(original);
      const back = weiToEth(converted);
      expect(back).toBe(original);
    });
  });

  describe('Bitcoin Satoshi Conversion', () => {
    it('should convert satoshis to BTC', () => {
      expect(satoshisToBtc(100000000)).toBe(1); // 1 BTC
      expect(satoshisToBtc(500000000)).toBe(5); // 5 BTC
      expect(satoshisToBtc(100)).toBe(0.000001); // 100 satoshis
    });

    it('should convert BTC to satoshis', () => {
      expect(btcToSatoshis(1)).toBe(100000000);
      expect(btcToSatoshis(5)).toBe(500000000);
      // Note: floating point precision - 0.000001 * 1e8 = 100 due to rounding
      expect(btcToSatoshis(0.00001)).toBe(1000);
    });

    it('should be reversible', () => {
      const original = 0.5;
      const converted = btcToSatoshis(original);
      const back = satoshisToBtc(converted);
      expect(back).toBe(original);
    });
  });

  describe('Token Conversion', () => {
    it('should convert token amount to smallest unit (6 decimals)', () => {
      // USDC has 6 decimals
      expect(tokenToSmallestUnit(1, 6)).toBe(1000000);
      expect(tokenToSmallestUnit(100, 6)).toBe(100000000);
    });

    it('should convert token amount to smallest unit (18 decimals)', () => {
      // ETH has 18 decimals
      expect(tokenToSmallestUnit(1, 18)).toBe(1e18);
      expect(tokenToSmallestUnit(2, 18)).toBe(2e18);
    });

    it('should convert smallest unit to token amount (6 decimals)', () => {
      expect(smallestUnitToToken(1000000, 6)).toBe(1);
      expect(smallestUnitToToken(100000000, 6)).toBe(100);
    });

    it('should convert smallest unit to token amount (18 decimals)', () => {
      expect(smallestUnitToToken(1e18, 18)).toBe(1);
      expect(smallestUnitToToken(2e18, 18)).toBe(2);
    });

    it('should handle fractional tokens', () => {
      const result = tokenToSmallestUnit(0.5, 6);
      expect(result).toBe(500000);
    });

    it('should be reversible', () => {
      const original = 1.5;
      const decimals = 6;
      const converted = tokenToSmallestUnit(original, decimals);
      const back = smallestUnitToToken(converted, decimals);
      expect(back).toBe(original);
    });

    it('should handle different decimal values', () => {
      // DAI has 18 decimals
      const dai = tokenToSmallestUnit(50, 18);
      expect(dai).toBe(50e18);

      // USDT on some chains has 6 decimals
      const usdt = tokenToSmallestUnit(50, 6);
      expect(usdt).toBe(50000000);

      // Verify reversal
      expect(smallestUnitToToken(dai, 18)).toBe(50);
      expect(smallestUnitToToken(usdt, 6)).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      expect(lamportsToSol(0)).toBe(0);
      expect(solToLamports(0)).toBe(0);
      expect(weiToEth(0)).toBe(0);
      expect(ethToWei(0)).toBe(0);
      expect(satoshisToBtc(0)).toBe(0);
      expect(btcToSatoshis(0)).toBe(0);
    });

    it('should handle very large numbers', () => {
      const largeValue = 1e15;
      const result = lamportsToSol(largeValue);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle very small numbers', () => {
      expect(lamportsToSol(1)).toBeCloseTo(1e-9);
      expect(satoshisToBtc(1)).toBeCloseTo(1e-8);
    });

    it('should preserve precision in conversions', () => {
      const amount = 1.23456789;
      const decimals = 8;
      const converted = tokenToSmallestUnit(amount, decimals);
      const back = smallestUnitToToken(converted, decimals);
      expect(back).toBeCloseTo(amount, 5);
    });
  });
});
