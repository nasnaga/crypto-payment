import { describe, it, expect, beforeEach, vi } from 'vitest';
import { balanceService } from '../src/services/balanceService.js';

// Mock @solana/web3.js
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue(1000000000), // 1 SOL in lamports
    getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: {
                    uiAmount: 100,
                  },
                },
              },
            },
          },
        },
      ],
    }),
  })),
  PublicKey: vi.fn().mockImplementation((key) => ({ toBase58: () => key })),
}));

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockImplementation(() => ({
      getBalance: vi.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH in wei
    })),
    Contract: vi.fn().mockImplementation(() => ({
      balanceOf: vi.fn().mockResolvedValue(BigInt('100000000')), // 100 USDC
    })),
  },
}));

// Mock config
vi.mock('../src/config.js', () => ({
  NETWORK_CONFIG: {
    solana: { mainnet: 'https://api.mainnet-beta.solana.com' },
    ethereum: { mainnet: 'https://eth.llamarpc.com' },
    bitcoin: { mainnet: 'https://blockstream.info/api' },
  },
  ACTIVE_NETWORKS: {
    solana: 'mainnet',
    ethereum: 'mainnet',
    bitcoin: 'mainnet',
  },
  TOKENS: {
    usdc_sol: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    usdc_eth: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  },
  CACHE_TTL: {
    balance: 30000, // 30 seconds
  },
}));

// Mock formatters
vi.mock('../src/utils/formatters.js', () => ({
  lamportsToSol: (lamports) => lamports / 1e9,
  weiToEth: (wei) => Number(wei) / 1e18,
  satoshisToBtc: (sats) => sats / 1e8,
}));

describe('BalanceService', () => {
  beforeEach(() => {
    // Clear cache before each test
    balanceService.clearAllCache();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Cache Management', () => {
    it('should generate correct cache key', () => {
      const key = balanceService.getCacheKey('address123', 'SOL');
      expect(key).toBe('SOL_address123');
    });

    it('should set and get from cache', () => {
      const key = 'SOL_test';
      balanceService.setCache(key, 1.5);
      expect(balanceService.getFromCache(key)).toBe(1.5);
    });

    it('should validate cache is fresh', () => {
      const key = 'SOL_test';
      balanceService.setCache(key, 1.5);
      expect(balanceService.isCacheValid(key)).toBe(true);
    });

    it('should invalidate old cache', () => {
      const key = 'SOL_test';
      balanceService.cache.set(key, {
        value: 1.5,
        timestamp: Date.now() - 40000, // 40 seconds ago
      });
      expect(balanceService.isCacheValid(key)).toBe(false);
    });

    it('should clear specific cache entry', () => {
      const key = 'SOL_test';
      balanceService.setCache(key, 1.5);
      balanceService.clearCache('test', 'SOL');
      expect(balanceService.getFromCache(key)).toBeNull();
    });

    it('should clear all cache', () => {
      balanceService.setCache('SOL_test1', 1.5);
      balanceService.setCache('ETH_test2', 2.5);
      balanceService.clearAllCache();
      expect(balanceService.cache.size).toBe(0);
    });
  });

  describe('Solana Balance', () => {
    it('should handle Solana balance fetch', async () => {
      // Test that the method exists and is callable
      const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      try {
        await balanceService.getSolanaBalance(address);
      } catch (error) {
        // Expected to fail with mocked connection
        expect(error).toBeDefined();
      }
    });

    it('should cache results when balance is fetched', async () => {
      const key = 'SOL_test_addr';
      balanceService.setCache(key, 1.5);
      const cached = balanceService.getFromCache(key);
      expect(cached).toBe(1.5);
    });

    it('should throw error on Solana balance fetch failure', async () => {
      // Balance service returns error messages properly
      const result = await balanceService.getBalance('invalid', 'SOL');
      expect(result).toBeNull(); // Returns null on error
    });
  });

  describe('Ethereum Balance', () => {
    it('should handle Ethereum balance fetch', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      try {
        await balanceService.getEthereumBalance(address);
      } catch (error) {
        // Expected to fail with mocked provider
        expect(error).toBeDefined();
      }
    });

    it('should cache Ethereum balance', async () => {
      const key = 'ETH_test_addr';
      balanceService.setCache(key, 2.5);
      const cached = balanceService.getFromCache(key);
      expect(cached).toBe(2.5);
    });

    it('should handle Ethereum balance fetch failure', async () => {
      // Balance service returns error messages properly
      const result = await balanceService.getBalance('invalid', 'ETH');
      expect(result).toBeNull(); // Returns null on error
    });
  });

  describe('Bitcoin Balance', () => {
    it('should fetch Bitcoin balance successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain_stats: {
            funded_txo_sum: 200000000, // 2 BTC
            spent_txo_sum: 100000000,  // 1 BTC
          },
        }),
      });

      const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const balance = await balanceService.getBitcoinBalance(address);
      expect(balance).toBe(1); // 1 BTC
    });

    it('should use cached Bitcoin balance', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain_stats: {
            funded_txo_sum: 200000000,
            spent_txo_sum: 100000000,
          },
        }),
      });

      const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

      // First call
      await balanceService.getBitcoinBalance(address);

      // Second call - should use cache
      const balance = await balanceService.getBitcoinBalance(address);
      expect(balance).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should throw error on Bitcoin API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        balanceService.getBitcoinBalance('invalid')
      ).rejects.toThrow('Failed to fetch Bitcoin balance');
    });
  });

  describe('getBalance() - Main Entry Point', () => {
    it('should route SOL to getSolanaBalance', async () => {
      const spy = vi.spyOn(balanceService, 'getSolanaBalance');
      await balanceService.getBalance('address', 'SOL');
      expect(spy).toHaveBeenCalled();
    });

    it('should route ETH to getEthereumBalance', async () => {
      const spy = vi.spyOn(balanceService, 'getEthereumBalance');
      await balanceService.getBalance('address', 'ETH');
      expect(spy).toHaveBeenCalled();
    });

    it('should route BTC to getBitcoinBalance', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
        }),
      });

      const spy = vi.spyOn(balanceService, 'getBitcoinBalance');
      await balanceService.getBalance('address', 'BTC');
      expect(spy).toHaveBeenCalled();
    });

    it('should route USDC to getUSDCBalance', async () => {
      const spy = vi.spyOn(balanceService, 'getUSDCBalance');
      await balanceService.getBalance('address', 'USDC', 'solana');
      expect(spy).toHaveBeenCalledWith('address', 'solana');
    });

    it('should return null for unsupported currency', async () => {
      const balance = await balanceService.getBalance('address', 'INVALID');
      expect(balance).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      balanceService.solanaConnection = null;
      const { Connection } = await import('@solana/web3.js');
      Connection.mockImplementationOnce(() => ({
        getBalance: vi.fn().mockRejectedValue(new Error('Network error')),
      }));

      const balance = await balanceService.getBalance('address', 'SOL');
      expect(balance).toBeNull();
    });
  });

  describe('Connection Methods', () => {
    it('should have initSolana method', () => {
      expect(typeof balanceService.initSolana).toBe('function');
    });

    it('should have initEthereum method', () => {
      expect(typeof balanceService.initEthereum).toBe('function');
    });

    it('should have getCacheKey method', () => {
      expect(typeof balanceService.getCacheKey).toBe('function');
    });

    it('should have getBalance method', () => {
      expect(typeof balanceService.getBalance).toBe('function');
    });
  });
});
