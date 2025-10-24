// Fee Service - Handle gas fee estimation for different networks
import { ethers } from 'ethers';
import { Connection } from '@solana/web3.js';
import { NETWORK_CONFIG, ACTIVE_NETWORKS } from '../config.js';

class FeeService {
  constructor() {
    this.ethereumProvider = null;
    this.solanaConnection = null;
    this.gasCache = {
      ethereum: null,
      timestamp: 0,
    };
  }

  // Initialize Ethereum provider
  initEthereumProvider() {
    if (!this.ethereumProvider) {
      const endpoint = NETWORK_CONFIG.ethereum[ACTIVE_NETWORKS.ethereum];
      this.ethereumProvider = new ethers.JsonRpcProvider(endpoint);
    }
    return this.ethereumProvider;
  }

  // Initialize Solana connection
  initSolanaConnection() {
    if (!this.solanaConnection) {
      const endpoint = NETWORK_CONFIG.solana[ACTIVE_NETWORKS.solana];
      this.solanaConnection = new Connection(endpoint, 'confirmed');
    }
    return this.solanaConnection;
  }

  // Get Ethereum gas prices
  async getEthereumGasPrices() {
    try {
      // Check cache (15 seconds TTL)
      const now = Date.now();
      if (this.gasCache.ethereum && (now - this.gasCache.timestamp) < 15000) {
        return this.gasCache.ethereum;
      }

      const provider = this.initEthereumProvider();
      const feeData = await provider.getFeeData();

      // Calculate slow, medium, fast gas prices
      const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      const gasPrices = {
        slow: {
          gasPrice: baseGasPrice * 8n / 10n, // 80% of base
          estimatedTime: '~5 min',
          gwei: ethers.formatUnits(baseGasPrice * 8n / 10n, 'gwei'),
        },
        medium: {
          gasPrice: baseGasPrice,
          estimatedTime: '~2 min',
          gwei: ethers.formatUnits(baseGasPrice, 'gwei'),
        },
        fast: {
          gasPrice: baseGasPrice * 13n / 10n, // 130% of base
          estimatedTime: '~30 sec',
          gwei: ethers.formatUnits(baseGasPrice * 13n / 10n, 'gwei'),
        },
      };

      // Cache the result
      this.gasCache.ethereum = gasPrices;
      this.gasCache.timestamp = now;

      return gasPrices;
    } catch (error) {
      console.error('Error fetching Ethereum gas prices:', error);
      // Return default values
      return {
        slow: { gasPrice: ethers.parseUnits('15', 'gwei'), estimatedTime: '~5 min', gwei: '15' },
        medium: { gasPrice: ethers.parseUnits('20', 'gwei'), estimatedTime: '~2 min', gwei: '20' },
        fast: { gasPrice: ethers.parseUnits('30', 'gwei'), estimatedTime: '~30 sec', gwei: '30' },
      };
    }
  }

  // Estimate gas for Ethereum transaction
  async estimateEthereumGas(from, to, value, data = '0x') {
    try {
      const provider = this.initEthereumProvider();

      const gasLimit = await provider.estimateGas({
        from,
        to,
        value: value ? ethers.parseEther(value.toString()) : 0n,
        data,
      });

      return gasLimit;
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return default gas limit
      return 21000n; // Standard transfer
    }
  }

  // Calculate transaction cost in ETH
  async calculateEthereumFee(gasLimit, speed = 'medium') {
    try {
      const gasPrices = await this.getEthereumGasPrices();
      const gasPrice = gasPrices[speed].gasPrice;

      const totalCost = BigInt(gasLimit) * BigInt(gasPrice);
      const costInEth = ethers.formatEther(totalCost);

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrices[speed].gwei,
        totalCost: costInEth,
        estimatedTime: gasPrices[speed].estimatedTime,
      };
    } catch (error) {
      console.error('Error calculating fee:', error);
      return null;
    }
  }

  // Get Solana priority fees
  async getSolanaPriorityFees() {
    try {
      const connection = this.initSolanaConnection();

      // Get recent prioritization fees
      const recentFees = await connection.getRecentPrioritizationFees();

      if (recentFees.length === 0) {
        return {
          none: 0,
          low: 1000,
          medium: 5000,
          high: 10000,
        };
      }

      // Calculate percentiles
      const fees = recentFees.map(f => f.prioritizationFee).sort((a, b) => a - b);
      const p50 = fees[Math.floor(fees.length * 0.5)];
      const p75 = fees[Math.floor(fees.length * 0.75)];
      const p90 = fees[Math.floor(fees.length * 0.9)];

      return {
        none: 0,
        low: Math.max(p50, 1000),
        medium: Math.max(p75, 5000),
        high: Math.max(p90, 10000),
      };
    } catch (error) {
      console.error('Error fetching Solana priority fees:', error);
      return {
        none: 0,
        low: 1000,
        medium: 5000,
        high: 10000,
      };
    }
  }

  // Estimate Solana transaction fee
  async estimateSolanaFee(priorityLevel = 'none') {
    try {
      const connection = this.initSolanaConnection();
      const priorityFees = await this.getSolanaPriorityFees();

      // Base fee is ~0.000005 SOL (5000 lamports)
      const baseFee = 5000;
      const priorityFee = priorityFees[priorityLevel] || 0;
      const totalFee = (baseFee + priorityFee) / 1e9; // Convert to SOL

      return {
        baseFee: baseFee / 1e9,
        priorityFee: priorityFee / 1e9,
        totalFee,
        priorityLevel,
      };
    } catch (error) {
      console.error('Error estimating Solana fee:', error);
      return {
        baseFee: 0.000005,
        priorityFee: 0,
        totalFee: 0.000005,
        priorityLevel: 'none',
      };
    }
  }
}

// Export singleton instance
export const feeService = new FeeService();
