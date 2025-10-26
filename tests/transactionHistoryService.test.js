import { describe, it, expect } from 'vitest';

// These tests verify the TransactionHistoryService API exists and is properly structured
// Note: Full integration tests with IndexedDB would require a database library with proper mocking support

describe('TransactionHistoryService API', () => {
  describe('Service Structure', () => {
    it('should export transactionHistoryService singleton', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(transactionHistoryService).toBeDefined();
      expect(typeof transactionHistoryService).toBe('object');
    });

    it('should have initDB method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.initDB).toBe('function');
    });

    it('should have addTransaction method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.addTransaction).toBe('function');
    });

    it('should have getAllTransactions method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.getAllTransactions).toBe('function');
    });

    it('should have getTransactionsByNetwork method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.getTransactionsByNetwork).toBe('function');
    });

    it('should have getTransactionsByStatus method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.getTransactionsByStatus).toBe('function');
    });

    it('should have updateTransactionStatus method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.updateTransactionStatus).toBe('function');
    });

    it('should have deleteTransaction method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.deleteTransaction).toBe('function');
    });

    it('should have clearAllTransactions method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.clearAllTransactions).toBe('function');
    });

    it('should have getTransactionCount method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.getTransactionCount).toBe('function');
    });

    it('should have getRecentTransactions method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.getRecentTransactions).toBe('function');
    });

    it('should have searchTransactions method', async () => {
      const { transactionHistoryService } = await import('../src/services/transactionHistoryService.js');
      expect(typeof transactionHistoryService.searchTransactions).toBe('function');
    });
  });
});
