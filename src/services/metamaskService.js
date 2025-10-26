// MetaMask Wallet Service - EVM Chain Support
import { ethers } from 'ethers';

class MetaMaskService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.accounts = [];
    this.currentAccount = null;
    this.currentChainId = null;
    this.isConnected = false;
  }

  // Check if MetaMask is installed
  isInstalled() {
    return !!(window.ethereum && window.ethereum.isMetaMask);
  }

  // Initialize MetaMask provider
  async init() {
    if (!this.isInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get current account
      this.accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (this.accounts.length > 0) {
        this.currentAccount = this.accounts[0];
        this.isConnected = true;
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.currentChainId = parseInt(chainId, 16);

      return true;
    } catch (error) {
      console.error('Error initializing MetaMask:', error);
      throw error;
    }
  }

  // Connect to MetaMask
  async connect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        this.currentAccount = accounts[0];
        this.accounts = accounts;
        this.isConnected = true;

        // Initialize signer after connection
        if (!this.signer) {
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        }

        // Get chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        this.currentChainId = parseInt(chainId, 16);

        return {
          account: this.currentAccount,
          chainId: this.currentChainId
        };
      }

      throw new Error('No accounts available');
    } catch (error) {
      console.error('Error connecting MetaMask:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Disconnect MetaMask
  async disconnect() {
    try {
      // Clean up event listeners first
      this.removeEventListeners();

      // Reset all state
      this.isConnected = false;
      this.currentAccount = null;
      this.accounts = [];
      this.currentChainId = null;
      this.signer = null;
      this.provider = null;

      return true;
    } catch (error) {
      console.error('Error disconnecting MetaMask:', error);
      throw error;
    }
  }

  // Get current account
  getAccount() {
    return this.currentAccount;
  }

  // Get all connected accounts
  getAccounts() {
    return this.accounts;
  }

  // Get current chain ID
  getChainId() {
    return this.currentChainId;
  }

  // Get balance for current account
  async getBalance() {
    try {
      if (!this.currentAccount || !this.provider) {
        return null;
      }

      const balance = await this.provider.getBalance(this.currentAccount);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }

  // Get balance for specific address
  async getBalanceOf(address) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance of:', error);
      return null;
    }
  }

  // Switch network
  async switchNetwork(chainId) {
    try {
      const chainIdHex = '0x' + chainId.toString(16);

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      this.currentChainId = chainId;
      return true;
    } catch (error) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId);
      }
      console.error('Error switching network:', error);
      throw error;
    }
  }

  // Add network to MetaMask
  async addNetwork(chainId, chainName, rpcUrl, symbol, blockExplorer) {
    try {
      const chainIdHex = '0x' + chainId.toString(16);

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName,
          rpcUrls: [rpcUrl],
          nativeCurrency: {
            name: symbol,
            symbol,
            decimals: 18,
          },
          blockExplorerUrls: [blockExplorer],
        }],
      });

      this.currentChainId = chainId;
      return true;
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  }

  // Send transaction
  async sendTransaction(to, amount) {
    try {
      if (!this.signer || !this.currentAccount) {
        throw new Error('Not connected to MetaMask');
      }

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount.toString()),
      });

      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Sign message
  async signMessage(message) {
    try {
      if (!this.signer) {
        throw new Error('Signer not available');
      }

      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  // Setup event listeners
  setupEventListeners(callbacks = {}) {
    if (!window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        this.currentAccount = accounts[0];
        this.accounts = accounts;
        if (callbacks.onAccountChanged) {
          callbacks.onAccountChanged(accounts[0]);
        }
      } else {
        this.isConnected = false;
        this.currentAccount = null;
        if (callbacks.onDisconnected) {
          callbacks.onDisconnected();
        }
      }
    });

    // Chain changed
    window.ethereum.on('chainChanged', (chainId) => {
      this.currentChainId = parseInt(chainId, 16);
      if (callbacks.onChainChanged) {
        callbacks.onChainChanged(this.currentChainId);
      }
    });

    // Connect
    window.ethereum.on('connect', (connectInfo) => {
      this.isConnected = true;
      if (callbacks.onConnected) {
        callbacks.onConnected();
      }
    });

    // Disconnect
    window.ethereum.on('disconnect', (error) => {
      this.isConnected = false;
      if (callbacks.onDisconnected) {
        callbacks.onDisconnected(error);
      }
    });
  }

  // Remove event listeners
  removeEventListeners() {
    if (!window.ethereum) return;
    window.ethereum.removeAllListeners();
  }
}

// Export singleton instance
export const metamaskService = new MetaMaskService();
