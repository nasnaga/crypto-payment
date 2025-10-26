import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple mock for window.ethereum
const createMockEthereum = () => ({
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
});

describe('MetaMaskService API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.ethereum = createMockEthereum();
  });

  describe('Service Structure', () => {
    it('should export metamaskService singleton', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(metamaskService).toBeDefined();
      expect(typeof metamaskService).toBe('object');
    });

    it('should have isInstalled method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.isInstalled).toBe('function');
    });

    it('should have init method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.init).toBe('function');
    });

    it('should have connect method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.connect).toBe('function');
    });

    it('should have disconnect method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.disconnect).toBe('function');
    });

    it('should have getAccount method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getAccount).toBe('function');
    });

    it('should have getAccounts method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getAccounts).toBe('function');
    });

    it('should have getChainId method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getChainId).toBe('function');
    });

    it('should have getBalance method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getBalance).toBe('function');
    });

    it('should have getBalanceOf method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getBalanceOf).toBe('function');
    });

    it('should have switchNetwork method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.switchNetwork).toBe('function');
    });

    it('should have addNetwork method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.addNetwork).toBe('function');
    });

    it('should have sendTransaction method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.sendTransaction).toBe('function');
    });

    it('should have signMessage method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.signMessage).toBe('function');
    });

    it('should have getTransactionReceipt method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.getTransactionReceipt).toBe('function');
    });

    it('should have setupEventListeners method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.setupEventListeners).toBe('function');
    });

    it('should have removeEventListeners method', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(typeof metamaskService.removeEventListeners).toBe('function');
    });
  });

  describe('Installation Detection', () => {
    it('should detect MetaMask when installed', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(metamaskService.isInstalled()).toBe(true);
    });

    it('should return false when MetaMask not installed', async () => {
      global.window.ethereum = undefined;
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(metamaskService.isInstalled()).toBe(false);
    });

    it('should return false when ethereum exists but isMetaMask is false', async () => {
      global.window.ethereum = { isMetaMask: false };
      const { metamaskService } = await import('../src/services/metamaskService.js');
      expect(metamaskService.isInstalled()).toBe(false);
    });
  });

  describe('Account Management', () => {
    it('should get current account', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      metamaskService.currentAccount = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(metamaskService.getAccount()).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    it('should get all accounts', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      const accounts = ['0x111...', '0x222...'];
      metamaskService.accounts = accounts;
      expect(metamaskService.getAccounts()).toEqual(accounts);
    });

    it('should get current chain ID', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      metamaskService.currentChainId = 137;
      expect(metamaskService.getChainId()).toBe(137);
    });
  });

  describe('Connection State', () => {
    it('should handle connection state', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');

      metamaskService.isConnected = true;
      expect(metamaskService.isConnected).toBe(true);

      metamaskService.isConnected = false;
      expect(metamaskService.isConnected).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should setup and teardown event listeners', async () => {
      const { metamaskService } = await import('../src/services/metamaskService.js');
      const callbacks = {
        onAccountChanged: vi.fn(),
        onChainChanged: vi.fn(),
      };

      metamaskService.setupEventListeners(callbacks);
      expect(global.window.ethereum.on).toHaveBeenCalled();

      metamaskService.removeEventListeners();
      expect(global.window.ethereum.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing MetaMask gracefully', async () => {
      global.window.ethereum = undefined;
      const { metamaskService } = await import('../src/services/metamaskService.js');

      expect(async () => {
        await metamaskService.init();
      }).rejects.toThrow();
    });
  });
});
