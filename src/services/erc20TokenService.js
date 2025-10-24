// ERC-20 Token Service - Handle all ERC-20 token operations on Ethereum
import { ethers } from 'ethers';
import { NETWORK_CONFIG, ACTIVE_NETWORKS, ERC20_TOKENS } from '../config.js';

class ERC20TokenService {
  constructor() {
    this.provider = null;
  }

  // Initialize Ethereum provider
  initProvider() {
    if (!this.provider) {
      const endpoint = NETWORK_CONFIG.ethereum[ACTIVE_NETWORKS.ethereum];
      this.provider = new ethers.JsonRpcProvider(endpoint);
    }
    return this.provider;
  }

  // ERC-20 standard ABI (minimal for balance and transfer)
  getERC20ABI() {
    return [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function name() view returns (string)',
    ];
  }

  // Get token balance
  async getTokenBalance(walletAddress, contractAddress, decimals) {
    try {
      const provider = this.initProvider();
      const contract = new ethers.Contract(contractAddress, this.getERC20ABI(), provider);

      const balance = await contract.balanceOf(walletAddress);
      const tokenBalance = Number(balance) / Math.pow(10, decimals);

      return tokenBalance;
    } catch (error) {
      console.error('Error fetching ERC-20 token balance:', error);
      return 0;
    }
  }

  // Transfer ERC-20 tokens
  async transferToken(ethereumProvider, contractAddress, recipientAddress, amount, decimals) {
    try {
      // Convert amount to token units
      const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

      // Get the contract instance
      const abi = this.getERC20ABI();

      // Request accounts
      const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
      const fromAddress = accounts[0];

      // Encode the transfer function call
      const contract = new ethers.Contract(contractAddress, abi, this.initProvider());
      const data = contract.interface.encodeFunctionData('transfer', [recipientAddress, tokenAmount]);

      // Send transaction via Phantom
      const txHash = await ethereumProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: contractAddress,
          data: data,
          gas: '0x186A0', // 100,000 gas - higher for token transfers
        }]
      });

      return txHash;
    } catch (error) {
      console.error('Error transferring ERC-20 token:', error);
      throw error;
    }
  }

  // Get all token balances for a wallet
  async getAllTokenBalances(walletAddress) {
    const balances = {};

    for (const [symbol, tokenInfo] of Object.entries(ERC20_TOKENS)) {
      const balance = await this.getTokenBalance(
        walletAddress,
        tokenInfo.address,
        tokenInfo.decimals
      );
      balances[symbol] = balance;
    }

    return balances;
  }

  // Get token info (name, symbol, decimals)
  async getTokenInfo(contractAddress) {
    try {
      const provider = this.initProvider();
      const contract = new ethers.Contract(contractAddress, this.getERC20ABI(), provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return { name, symbol, decimals: Number(decimals) };
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const erc20TokenService = new ERC20TokenService();
