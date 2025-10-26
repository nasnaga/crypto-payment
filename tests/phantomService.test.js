import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phantom wallet
const createMockPhantomWallet = () => ({
  solana: {
    isPhantom: true,
    connect: vi.fn().mockResolvedValue({ publicKey: { toString: () => 'SolanaAddress123' } }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  ethereum: {
    isPhantom: true,
    request: vi.fn().mockResolvedValue(['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb']),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  bitcoin: {
    isPhantom: true,
    requestAccounts: vi.fn().mockResolvedValue([{ address: 'BitcoinAddress123' }]),
  },
});

describe('PhantomService API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.phantom = createMockPhantomWallet();
  });

  describe('Service Structure', () => {
    it('should export phantomService singleton', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(phantomService).toBeDefined();
      expect(typeof phantomService).toBe('object');
    });

    it('should have checkPhantomWallet method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.checkPhantomWallet).toBe('function');
    });

    it('should have connectAll method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.connectAll).toBe('function');
    });

    it('should have disconnect method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.disconnect).toBe('function');
    });

    it('should have getProvider method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.getProvider).toBe('function');
    });

    it('should have getAddress method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.getAddress).toBe('function');
    });

    it('should have isConnected method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.isConnected).toBe('function');
    });

    it('should have setupListeners method', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(typeof phantomService.setupListeners).toBe('function');
    });
  });

  describe('Wallet Detection', () => {
    it('should detect Phantom wallet when installed', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      const detected = phantomService.checkPhantomWallet();
      expect(detected).toBe(true);
    });

    it('should detect Solana provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      expect(phantomService.solanaProvider).toBeDefined();
      expect(phantomService.solanaProvider.isPhantom).toBe(true);
    });

    it('should detect Ethereum provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      expect(phantomService.ethereumProvider).toBeDefined();
      expect(phantomService.ethereumProvider.isPhantom).toBe(true);
    });

    it('should detect Bitcoin provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      expect(phantomService.bitcoinProvider).toBeDefined();
      expect(phantomService.bitcoinProvider.isPhantom).toBe(true);
    });

    it('should return false when Phantom not installed', async () => {
      global.window.phantom = undefined;
      const { phantomService } = await import('../src/services/phantomService.js');
      const detected = phantomService.checkPhantomWallet();
      expect(detected).toBe(false);
    });
  });

  describe('Connection State', () => {
    it('should be disconnected by default', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      expect(phantomService.isConnected()).toBe(false);
    });

    it('should track connected state', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.connected = true;
      expect(phantomService.isConnected()).toBe(true);
    });
  });

  describe('Provider Access', () => {
    it('should get Solana provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      const provider = phantomService.getProvider('solana');
      expect(provider).toBeDefined();
      expect(provider.isPhantom).toBe(true);
    });

    it('should get Ethereum provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      const provider = phantomService.getProvider('ethereum');
      expect(provider).toBeDefined();
      expect(provider.isPhantom).toBe(true);
    });

    it('should get Bitcoin provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      const provider = phantomService.getProvider('bitcoin');
      expect(provider).toBeDefined();
      expect(provider.isPhantom).toBe(true);
    });

    it('should return null for unsupported provider', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      const provider = phantomService.getProvider('unknown');
      expect(provider).toBeNull();
    });
  });

  describe('Disconnect Functionality', () => {
    it('should disconnect and reset all wallet addresses', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');

      // Set up connected state with addresses
      phantomService.walletAddresses = {
        solana: 'SolanaAddress123',
        ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        bitcoin: 'BitcoinAddress123',
      };
      phantomService.connected = true;

      // Disconnect
      const result = await phantomService.disconnect();

      expect(result).toBe(true);
      expect(phantomService.walletAddresses.solana).toBeNull();
      expect(phantomService.walletAddresses.ethereum).toBeNull();
      expect(phantomService.walletAddresses.bitcoin).toBeNull();
      expect(phantomService.connected).toBe(false);
    });

    it('should call Solana disconnect when available', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();

      await phantomService.disconnect();

      expect(phantomService.solanaProvider.disconnect).toHaveBeenCalled();
    });

    it('should handle Solana disconnect errors gracefully', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();
      phantomService.solanaProvider.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const result = await phantomService.disconnect();

      expect(result).toBe(true);
      expect(phantomService.connected).toBe(false);
    });

    it('should handle disconnect when already disconnected', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');

      phantomService.connected = false;
      phantomService.walletAddresses = { solana: null, ethereum: null, bitcoin: null };

      const result = await phantomService.disconnect();

      expect(result).toBe(true);
      expect(phantomService.connected).toBe(false);
    });

    it('should allow reconnection after disconnect', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');

      // First set connected
      phantomService.walletAddresses = {
        solana: 'SolanaAddress123',
        ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        bitcoin: 'BitcoinAddress123',
      };
      phantomService.connected = true;

      // Disconnect
      await phantomService.disconnect();
      expect(phantomService.connected).toBe(false);

      // Can set connected again
      phantomService.walletAddresses.solana = 'NewSolanaAddress';
      phantomService.connected = true;
      expect(phantomService.connected).toBe(true);
      expect(phantomService.walletAddresses.solana).toBe('NewSolanaAddress');
    });

    it('should reset all networks on disconnect', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      const initialAddresses = {
        solana: 'addr1',
        ethereum: 'addr2',
        bitcoin: 'addr3',
      };

      phantomService.walletAddresses = initialAddresses;
      await phantomService.disconnect();

      Object.values(phantomService.walletAddresses).forEach(address => {
        expect(address).toBeNull();
      });
    });
  });

  describe('Address Management', () => {
    it('should get address for Solana', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.walletAddresses.solana = 'SolanaAddress123';
      const address = phantomService.getAddress('solana');
      expect(address).toBe('SolanaAddress123');
    });

    it('should get address for Ethereum', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.walletAddresses.ethereum = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const address = phantomService.getAddress('ethereum');
      expect(address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    it('should return null for unset address', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      // Reset to null to test unset address
      phantomService.walletAddresses.bitcoin = null;
      const address = phantomService.getAddress('bitcoin');
      expect(address).toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should setup event listeners', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();

      const callbacks = {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onAccountChange: vi.fn(),
      };

      phantomService.setupListeners(callbacks.onConnect, callbacks.onDisconnect, callbacks.onAccountChange);

      expect(phantomService.solanaProvider.on).toHaveBeenCalled();
    });

    it('should handle account changes', async () => {
      const { phantomService } = await import('../src/services/phantomService.js');
      phantomService.checkPhantomWallet();

      const onAccountChange = vi.fn();
      phantomService.setupListeners(null, null, onAccountChange);

      expect(phantomService.solanaProvider.on).toHaveBeenCalled();
    });
  });
});
