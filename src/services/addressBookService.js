// Address Book Service - Store and manage contact addresses using IndexedDB
import { openDB } from 'idb';

class AddressBookService {
  constructor() {
    this.dbName = 'CryptoPaymentDB';
    this.storeName = 'addressBook';
    this.dbVersion = 2; // Incremented from transaction history version
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create transactions store if upgrading from version 0
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          txStore.createIndex('timestamp', 'timestamp');
          txStore.createIndex('network', 'network');
          txStore.createIndex('status', 'status');
          txStore.createIndex('txHash', 'txHash');
        }

        // Create address book store
        if (!db.objectStoreNames.contains('addressBook')) {
          const store = db.createObjectStore('addressBook', {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes
          store.createIndex('name', 'name');
          store.createIndex('network', 'network');
          store.createIndex('address', 'address');
          store.createIndex('lastUsed', 'lastUsed');
        }
      },
    });

    return this.db;
  }

  // Add a contact to address book
  async addContact(contact) {
    try {
      const db = await this.initDB();

      const contactRecord = {
        name: contact.name,
        address: contact.address,
        network: contact.network,
        notes: contact.notes || '',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      const id = await db.add(this.storeName, contactRecord);
      return { ...contactRecord, id };
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  // Get all contacts
  async getAllContacts() {
    try {
      const db = await this.initDB();
      const contacts = await db.getAll(this.storeName);

      // Sort by name
      return contacts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  // Get contacts by network
  async getContactsByNetwork(network) {
    try {
      const db = await this.initDB();
      const index = db.transaction(this.storeName).store.index('network');
      const contacts = await index.getAll(network);

      return contacts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting contacts by network:', error);
      return [];
    }
  }

  // Get contact by ID
  async getContact(id) {
    try {
      const db = await this.initDB();
      return await db.get(this.storeName, id);
    } catch (error) {
      console.error('Error getting contact:', error);
      return null;
    }
  }

  // Update contact
  async updateContact(id, updates) {
    try {
      const db = await this.initDB();
      const contact = await db.get(this.storeName, id);

      if (contact) {
        const updatedContact = {
          ...contact,
          ...updates,
        };
        await db.put(this.storeName, updatedContact);
        return updatedContact;
      }

      return null;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Update last used timestamp
  async updateLastUsed(id) {
    try {
      const db = await this.initDB();
      const contact = await db.get(this.storeName, id);

      if (contact) {
        contact.lastUsed = Date.now();
        await db.put(this.storeName, contact);
      }
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }

  // Delete contact
  async deleteContact(id) {
    try {
      const db = await this.initDB();
      await db.delete(this.storeName, id);
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  }

  // Search contacts
  async searchContacts(searchTerm) {
    try {
      const allContacts = await this.getAllContacts();

      return allContacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.address?.toLowerCase().includes(searchLower) ||
          contact.notes?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  // Check if address exists
  async addressExists(address, network) {
    try {
      const contacts = await this.getContactsByNetwork(network);
      return contacts.some(contact => contact.address.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking address:', error);
      return false;
    }
  }

  // Get contact count
  async getContactCount() {
    try {
      const db = await this.initDB();
      return await db.count(this.storeName);
    } catch (error) {
      console.error('Error getting contact count:', error);
      return 0;
    }
  }

  // Clear all contacts
  async clearAllContacts() {
    try {
      const db = await this.initDB();
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('Error clearing contacts:', error);
      return false;
    }
  }
}

// Export singleton instance
export const addressBookService = new AddressBookService();
