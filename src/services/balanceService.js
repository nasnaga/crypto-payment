// Balance Service - Fetch balances for all supported currencies
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { NETWORK_CONFIG, ACTIVE_NETWORKS, TOKENS, CACHE_TTL } from '../config.js';
import { lamportsToSol, weiToEth, satoshisToBtc } from '../utils/formatters.js';

class BalanceService {
  constructor() {
    this.cache = new Map();
    this.solanaConnection = null;
    this.ethereumProvider = null;
  }

  // Initialize Solana connection
  initSolana() {
    if (!this.solanaConnection) {
      const endpoint = NETWORK_CONFIG.solana[ACTIVE_NETWORKS.solana];
      this.solanaConnection = new Connection(endpoint, 'confirmed');
    }
    return this.solanaConnection;
  }

  // Initialize Ethereum provider
  initEthereum() {
    if (!this.ethereumProvider) {
      const endpoint = NETWORK_CONFIG.ethereum[ACTIVE_NETWORKS.ethereum];
      this.ethereumProvider = new ethers.JsonRpcProvider(endpoint);
    }
    return this.ethereumProvider;
  }

  // Get cache key
  getCacheKey(address, currency) {
    return `${currency}_${address}`;
  }

  // Check if cache is valid
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < CACHE_TTL.balance;
  }

  // Get from cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    return cached ? cached.value : null;
  }

  // Set cache
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  // Fetch Solana balance
  async getSolanaBalance(address) {
    try {
      const cacheKey = this.getCacheKey(address, 'SOL');

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.getFromCache(cacheKey);
      }

      const connection = this.initSolana();
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      const solBalance = lamportsToSol(balance);

      // Cache the result
      this.setCache(cacheKey, solBalance);

      return solBalance;
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      throw new Error('Failed to fetch Solana balance');
    }
  }

  // Fetch Ethereum balance
  async getEthereumBalance(address) {
    try {
      const cacheKey = this.getCacheKey(address, 'ETH');

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.getFromCache(cacheKey);
      }

      const provider = this.initEthereum();
      const balance = await provider.getBalance(address);
      const ethBalance = weiToEth(balance);

      // Cache the result
      this.setCache(cacheKey, ethBalance);

      return ethBalance;
    } catch (error) {
      console.error('Error fetching Ethereum balance:', error);
      throw new Error('Failed to fetch Ethereum balance');
    }
  }

  // Fetch Bitcoin balance
  async getBitcoinBalance(address) {
    try {
      const cacheKey = this.getCacheKey(address, 'BTC');

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.getFromCache(cacheKey);
      }

      // Use Blockstream API for Bitcoin balance
      const endpoint = NETWORK_CONFIG.bitcoin[ACTIVE_NETWORKS.bitcoin];
      const response = await fetch(`${endpoint}/address/${address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin balance from API');
      }

      const data = await response.json();
      const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const btcBalance = satoshisToBtc(balance);

      // Cache the result
      this.setCache(cacheKey, btcBalance);

      return btcBalance;
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
      throw new Error('Failed to fetch Bitcoin balance');
    }
  }

  // Fetch USDC balance (Solana SPL token)
  async getUSDCBalance(address, network = 'solana') {
    try {
      const cacheKey = this.getCacheKey(address, `USDC_${network}`);

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.getFromCache(cacheKey);
      }

      if (network === 'solana') {
        return await this.getSolanaTokenBalance(address, TOKENS.usdc_sol.mint);
      } else if (network === 'ethereum') {
        return await this.getERC20Balance(address, TOKENS.usdc_eth.address, TOKENS.usdc_eth.decimals);
      }

      throw new Error('Unsupported network for USDC');
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      throw new Error('Failed to fetch USDC balance');
    }
  }

  // Fetch Solana SPL token balance
  async getSolanaTokenBalance(address, mintAddress) {
    try {
      const connection = this.initSolana();
      const publicKey = new PublicKey(address);
      const mintPublicKey = new PublicKey(mintAddress);

      // Get token accounts for this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: mintPublicKey,
      });

      if (tokenAccounts.value.length === 0) {
        return 0; // No token account found
      }

      // Sum up all token account balances
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
        totalBalance += balance;
      }

      return totalBalance;
    } catch (error) {
      console.error('Error fetching Solana token balance:', error);
      return 0;
    }
  }

  // Fetch ERC-20 token balance
  async getERC20Balance(address, contractAddress, decimals) {
    try {
      const provider = this.initEthereum();

      // ERC-20 balanceOf ABI
      const abi = ['function balanceOf(address owner) view returns (uint256)'];
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const balance = await contract.balanceOf(address);
      const tokenBalance = Number(balance) / Math.pow(10, decimals);

      return tokenBalance;
    } catch (error) {
      console.error('Error fetching ERC-20 balance:', error);
      return 0;
    }
  }

  // Get balance for any currency
  async getBalance(address, currency, network = null) {
    try {
      switch (currency) {
        case 'SOL':
          return await this.getSolanaBalance(address);
        case 'ETH':
          return await this.getEthereumBalance(address);
        case 'BTC':
          return await this.getBitcoinBalance(address);
        case 'USDC':
          return await this.getUSDCBalance(address, network || 'solana');
        default:
          throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      console.error(`Error getting ${currency} balance:`, error);
      return null;
    }
  }

  // Clear cache for a specific address/currency
  clearCache(address, currency) {
    const key = this.getCacheKey(address, currency);
    this.cache.delete(key);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const balanceService = new BalanceService();
