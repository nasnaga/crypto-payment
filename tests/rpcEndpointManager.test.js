import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RpcEndpointManager', () => {
  let manager;

  beforeEach(async () => {
    const { rpcEndpointManager } = await import('../src/utils/rpcEndpointManager.js');
    manager = rpcEndpointManager;
    manager.resetStatus();
  });

  describe('Fallback Logic', () => {
    it('should use first endpoint when successful', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com', 'https://endpoint3.com'];
      const mockFunction = vi.fn().mockResolvedValue({ success: true });

      const result = await manager.executeWithFallback('test', endpoints, mockFunction);

      expect(result).toEqual({ success: true });
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith(endpoints[0]);
    });

    it('should try fallback endpoints on failure', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com', 'https://endpoint3.com'];
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Endpoint 1 failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await manager.executeWithFallback('test', endpoints, mockFunction);

      expect(result).toEqual({ success: true });
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('should try all endpoints before giving up', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com', 'https://endpoint3.com'];
      const mockFunction = vi.fn().mockRejectedValue(new Error('All failed'));

      try {
        await manager.executeWithFallback('test', endpoints, mockFunction);
      } catch (error) {
        expect(error.message).toContain('All RPC endpoints failed');
        expect(error.details.length).toBe(3);
      }

      expect(mockFunction).toHaveBeenCalledTimes(3);
    });

    it('should convert single endpoint string to array', async () => {
      const endpoint = 'https://single-endpoint.com';
      const mockFunction = vi.fn().mockResolvedValue({ data: 'test' });

      const result = await manager.executeWithFallback('test', endpoint, mockFunction);

      expect(result).toEqual({ data: 'test' });
      expect(mockFunction).toHaveBeenCalledWith(endpoint);
    });
  });

  describe('Error Detection', () => {
    it('should detect rate limit errors (429)', () => {
      const error = new Error('429 Too Many Requests');
      expect(manager.isTemporaryError(error)).toBe(true);
    });

    it('should detect access forbidden errors (403)', () => {
      const error = new Error('403 Forbidden');
      error.code = 403;
      expect(manager.isTemporaryError(error)).toBe(true);
    });

    it('should detect "too many requests" message', () => {
      const error = new Error('too many requests from your IP');
      expect(manager.isTemporaryError(error)).toBe(true);
    });

    it('should detect "rate limit" message', () => {
      const error = new Error('rate limit exceeded');
      expect(manager.isTemporaryError(error)).toBe(true);
    });

    it('should not mark permanent errors as temporary', () => {
      const error = new Error('Invalid address format');
      expect(manager.isTemporaryError(error)).toBe(false);
    });
  });

  describe('Endpoint Status Tracking', () => {
    it('should mark endpoint as healthy after success', async () => {
      const endpoints = ['https://endpoint1.com'];
      const mockFunction = vi.fn().mockResolvedValue({ data: 'success' });

      await manager.executeWithFallback('chain', endpoints, mockFunction);

      const status = manager.getStatus('chain', endpoints);
      expect(status['https://endpoint1.com'].isHealthy).toBe(true);
    });

    it('should mark endpoint as unhealthy after rate limit error', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com'];
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('429 rate limit'))
        .mockResolvedValueOnce({ data: 'success' });

      await manager.executeWithFallback('chain', endpoints, mockFunction);

      const status = manager.getStatus('chain', endpoints);
      expect(status['https://endpoint1.com'].isHealthy).toBe(false);
      expect(status['https://endpoint2.com'].isHealthy).toBe(true);
    });

    it('should prioritize healthy endpoints', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com', 'https://endpoint3.com'];
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('429'))
        .mockResolvedValueOnce({ data: 'success' });

      // First call: endpoint1 fails, endpoint2 succeeds
      await manager.executeWithFallback('chain', endpoints, mockFunction);

      // Reset mock for second call
      mockFunction.mockClear();
      mockFunction.mockResolvedValue({ data: 'success2' });

      // Second call should try healthy endpoint first
      await manager.executeWithFallback('chain', endpoints, mockFunction);

      // Should have called endpoint2 first (the one that worked before)
      expect(mockFunction).toHaveBeenCalledWith('https://endpoint2.com');
    });
  });

  describe('Endpoint Recovery', () => {
    it('should retry failed endpoint after delay', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com'];
      manager.retryDelay = 100; // 100ms for testing

      // Mark endpoint1 as unhealthy
      manager.markEndpointUnhealthy('chain', endpoints[0]);

      let status = manager.getStatus('chain', endpoints);
      expect(status['https://endpoint1.com'].isHealthy).toBe(false);

      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Endpoint should be eligible for retry now
      const healthyEndpoints = manager.getHealthyEndpoints('chain', endpoints);
      expect(healthyEndpoints).toContain(endpoints[0]);
    });

    it('should reset all statuses', () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com'];

      manager.markEndpointUnhealthy('chain', endpoints[0]);
      manager.markEndpointHealthy('chain', endpoints[1]);

      let status = manager.getStatus('chain', endpoints);
      expect(status['https://endpoint1.com'].isHealthy).toBe(false);

      manager.resetStatus();

      status = manager.getStatus('chain', endpoints);
      expect(status['https://endpoint1.com'].isHealthy).toBe(true);
      expect(status['https://endpoint2.com'].isHealthy).toBe(true);
    });
  });

  describe('Error Details', () => {
    it('should include error details when all endpoints fail', async () => {
      const endpoints = ['https://endpoint1.com', 'https://endpoint2.com'];
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Timeout'));

      try {
        await manager.executeWithFallback('chain', endpoints, mockFunction);
      } catch (error) {
        expect(error.details).toBeDefined();
        expect(error.details.length).toBe(2);
        expect(error.details[0]).toMatchObject({
          endpoint: 'https://endpoint1.com',
          error: 'Connection refused',
        });
        expect(error.details[1]).toMatchObject({
          endpoint: 'https://endpoint2.com',
          error: 'Timeout',
        });
      }
    });

    it('should include error codes in details', async () => {
      const endpoints = ['https://endpoint1.com'];
      const error = new Error('Forbidden');
      error.code = 403;
      const mockFunction = vi.fn().mockRejectedValue(error);

      try {
        await manager.executeWithFallback('chain', endpoints, mockFunction);
      } catch (err) {
        expect(err.details[0].code).toBe(403);
      }
    });
  });

  describe('Health Management Methods', () => {
    it('should have markEndpointHealthy method', () => {
      expect(typeof manager.markEndpointHealthy).toBe('function');
    });

    it('should have markEndpointUnhealthy method', () => {
      expect(typeof manager.markEndpointUnhealthy).toBe('function');
    });

    it('should have getHealthyEndpoints method', () => {
      expect(typeof manager.getHealthyEndpoints).toBe('function');
    });

    it('should have resetStatus method', () => {
      expect(typeof manager.resetStatus).toBe('function');
    });

    it('should have getStatus method', () => {
      expect(typeof manager.getStatus).toBe('function');
    });

    it('should have isTemporaryError method', () => {
      expect(typeof manager.isTemporaryError).toBe('function');
    });

    it('should have executeWithFallback method', () => {
      expect(typeof manager.executeWithFallback).toBe('function');
    });
  });
});
