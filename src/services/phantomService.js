// Phantom Wallet Service - Handle wallet connections
class PhantomService {
  constructor() {
    this.solanaProvider = null;
    this.ethereumProvider = null;
    this.bitcoinProvider = null;
    this.connected = false;
    this.walletAddresses = {
      solana: null,
      ethereum: null,
      bitcoin: null,
    };
  }

  // Check if Phantom is installed
  checkPhantomWallet() {
    // Check for Phantom's multi-chain support
    if (window.phantom) {
      console.log('Phantom wallet detected');

      // Solana provider
      if (window.phantom.solana && window.phantom.solana.isPhantom) {
        this.solanaProvider = window.phantom.solana;
        console.log('Solana provider available');
      }

      // Ethereum provider
      if (window.phantom.ethereum && window.phantom.ethereum.isPhantom) {
        this.ethereumProvider = window.phantom.ethereum;
        console.log('Ethereum provider available');
      }

      // Bitcoin provider
      if (window.phantom.bitcoin && window.phantom.bitcoin.isPhantom) {
        this.bitcoinProvider = window.phantom.bitcoin;
        console.log('Bitcoin provider available');
      }

      // Fallback to window.solana for older Phantom versions
      if (!this.solanaProvider && window.solana && window.solana.isPhantom) {
        this.solanaProvider = window.solana;
        console.log('Using legacy Solana provider');
      }

      return true;
    } else if (window.solana && window.solana.isPhantom) {
      // Fallback for older Phantom versions
      this.solanaProvider = window.solana;
      console.log('Using legacy Phantom wallet');
      return true;
    }

    return false;
  }

  // Connect to all available wallets
  async connectAll() {
    const connectionPromises = [];

    if (this.solanaProvider) {
      connectionPromises.push(
        this.solanaProvider.connect()
          .then(response => ({
            network: 'solana',
            address: response.publicKey.toString(),
            success: true,
          }))
          .catch(error => ({
            network: 'solana',
            error: error.message,
            success: false,
          }))
      );
    }

    if (this.ethereumProvider) {
      connectionPromises.push(
        this.ethereumProvider.request({ method: 'eth_requestAccounts' })
          .then(accounts => ({
            network: 'ethereum',
            address: accounts[0],
            success: true,
          }))
          .catch(error => ({
            network: 'ethereum',
            error: error.message,
            success: false,
          }))
      );
    }

    if (this.bitcoinProvider) {
      connectionPromises.push(
        this.bitcoinProvider.requestAccounts()
          .then(accounts => ({
            network: 'bitcoin',
            address: accounts[0].address,
            success: true,
          }))
          .catch(error => ({
            network: 'bitcoin',
            error: error.message,
            success: false,
          }))
      );
    }

    const results = await Promise.allSettled(connectionPromises);

    // Process results
    const connections = {};
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { network, address } = result.value;
        this.walletAddresses[network] = address;
        connections[network] = address;
      }
    });

    this.connected = Object.keys(connections).length > 0;

    return connections;
  }

  // Get provider for specific network
  getProvider(network) {
    switch (network.toLowerCase()) {
      case 'solana':
      case 'sol':
        return this.solanaProvider;
      case 'ethereum':
      case 'eth':
        return this.ethereumProvider;
      case 'bitcoin':
      case 'btc':
        return this.bitcoinProvider;
      default:
        return null;
    }
  }

  // Get wallet address for network
  getAddress(network) {
    return this.walletAddresses[network.toLowerCase()];
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }

  // Disconnect (if supported)
  async disconnect() {
    if (this.solanaProvider && this.solanaProvider.disconnect) {
      try {
        await this.solanaProvider.disconnect();
      } catch (error) {
        console.error('Error disconnecting Solana:', error);
      }
    }

    this.walletAddresses = {
      solana: null,
      ethereum: null,
      bitcoin: null,
    };
    this.connected = false;
  }

  // Setup event listeners
  setupListeners(onConnect, onDisconnect, onAccountChange) {
    if (this.solanaProvider) {
      if (onConnect) {
        this.solanaProvider.on('connect', () => onConnect('solana'));
      }
      if (onDisconnect) {
        this.solanaProvider.on('disconnect', () => onDisconnect('solana'));
      }
      if (onAccountChange) {
        this.solanaProvider.on('accountChanged', (publicKey) => {
          if (publicKey) {
            this.walletAddresses.solana = publicKey.toString();
            onAccountChange('solana', publicKey.toString());
          }
        });
      }
    }

    if (this.ethereumProvider) {
      if (onAccountChange) {
        this.ethereumProvider.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            this.walletAddresses.ethereum = accounts[0];
            onAccountChange('ethereum', accounts[0]);
          } else if (onDisconnect) {
            onDisconnect('ethereum');
          }
        });
      }
    }
  }
}

// Export singleton instance
export const phantomService = new PhantomService();
