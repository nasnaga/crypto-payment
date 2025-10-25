// Transaction History Service - Store and retrieve transaction history using IndexedDB
import { openDB } from 'idb';

class TransactionHistoryService {
  constructor() {
    this.dbName = 'CryptoPaymentDB';
    this.storeName = 'transactions';
    this.dbVersion = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('network', 'network');
          store.createIndex('status', 'status');
          store.createIndex('txHash', 'txHash');
        }
      },
    });

    return this.db;
  }

  // Add a transaction to history
  async addTransaction(transaction) {
    try {
      const db = await this.initDB();

      const txRecord = {
        txHash: transaction.txHash,
        timestamp: transaction.timestamp || Date.now(),
        amount: transaction.amount,
        currency: transaction.currency,
        recipient: transaction.recipient,
        sender: transaction.sender,
        status: transaction.status || 'pending',
        network: transaction.network,
        fee: transaction.fee || null,
        explorerUrl: transaction.explorerUrl || null,
      };

      const id = await db.add(this.storeName, txRecord);
      return { ...txRecord, id };
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      const db = await this.initDB();
      const transactions = await db.getAll(this.storeName);

      // Sort by timestamp (newest first)
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Get transactions by network
  async getTransactionsByNetwork(network) {
    try {
      const db = await this.initDB();
      const index = db.transaction(this.storeName).store.index('network');
      const transactions = await index.getAll(network);

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transactions by network:', error);
      return [];
    }
  }

  // Get transactions by status
  async getTransactionsByStatus(status) {
    try {
      const db = await this.initDB();
      const index = db.transaction(this.storeName).store.index('status');
      const transactions = await index.getAll(status);

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transactions by status:', error);
      return [];
    }
  }

  // Update transaction status
  async updateTransactionStatus(txHash, status) {
    try {
      const db = await this.initDB();
      const allTransactions = await db.getAll(this.storeName);

      const transaction = allTransactions.find(tx => tx.txHash === txHash);
      if (transaction) {
        transaction.status = status;
        await db.put(this.storeName, transaction);
        return transaction;
      }

      return null;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Delete a transaction
  async deleteTransaction(id) {
    try {
      const db = await this.initDB();
      await db.delete(this.storeName, id);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  // Clear all transactions
  async clearAllTransactions() {
    try {
      const db = await this.initDB();
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('Error clearing transactions:', error);
      return false;
    }
  }

  // Get transaction count
  async getTransactionCount() {
    try {
      const db = await this.initDB();
      return await db.count(this.storeName);
    } catch (error) {
      console.error('Error getting transaction count:', error);
      return 0;
    }
  }

  // Get recent transactions (limit)
  async getRecentTransactions(limit = 10) {
    try {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  // Search transactions
  async searchTransactions(searchTerm) {
    try {
      const allTransactions = await this.getAllTransactions();

      return allTransactions.filter(tx => {
        const searchLower = searchTerm.toLowerCase();
        return (
          tx.txHash?.toLowerCase().includes(searchLower) ||
          tx.recipient?.toLowerCase().includes(searchLower) ||
          tx.sender?.toLowerCase().includes(searchLower) ||
          tx.currency?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      console.error('Error searching transactions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const transactionHistoryService = new TransactionHistoryService();
