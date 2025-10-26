import { describe, it, expect } from 'vitest';

// These tests verify the AddressBookService API exists and is properly structured
// Note: Full integration tests with IndexedDB would require a database library with proper mocking support

describe('AddressBookService API', () => {
  describe('Service Structure', () => {
    it('should export addressBookService singleton', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(addressBookService).toBeDefined();
      expect(typeof addressBookService).toBe('object');
    });

    it('should have initDB method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.initDB).toBe('function');
    });

    it('should have addContact method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.addContact).toBe('function');
    });

    it('should have getAllContacts method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.getAllContacts).toBe('function');
    });

    it('should have getContactsByNetwork method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.getContactsByNetwork).toBe('function');
    });

    it('should have getContact method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.getContact).toBe('function');
    });

    it('should have updateContact method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.updateContact).toBe('function');
    });

    it('should have updateLastUsed method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.updateLastUsed).toBe('function');
    });

    it('should have deleteContact method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.deleteContact).toBe('function');
    });

    it('should have searchContacts method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.searchContacts).toBe('function');
    });

    it('should have addressExists method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.addressExists).toBe('function');
    });

    it('should have getContactCount method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.getContactCount).toBe('function');
    });

    it('should have clearAllContacts method', async () => {
      const { addressBookService } = await import('../src/services/addressBookService.js');
      expect(typeof addressBookService.clearAllContacts).toBe('function');
    });
  });
});
