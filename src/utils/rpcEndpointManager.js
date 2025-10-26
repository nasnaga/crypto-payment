// RPC Endpoint Manager - Handles fallback logic for multiple RPC endpoints
class RpcEndpointManager {
  constructor() {
    this.endpointStatus = new Map(); // Track endpoint health
    this.retryDelay = 5000; // 5 seconds before retrying a failed endpoint
  }

  /**
   * Execute function against multiple endpoints with fallback
   * @param {string} chainName - Name of the blockchain (solana, ethereum, bitcoin)
   * @param {Array<string>} endpoints - Array of RPC endpoint URLs
   * @param {Function} executeFunction - Async function that takes an endpoint URL
   * @returns {Promise} Result from the first successful endpoint
   */
  async executeWithFallback(chainName, endpoints, executeFunction) {
    if (!Array.isArray(endpoints)) {
      endpoints = [endpoints];
    }

    const errors = [];
    const healthyEndpoints = this.getHealthyEndpoints(chainName, endpoints);

    // Try healthy endpoints first, then all endpoints
    const endpointsToTry = [
      ...healthyEndpoints,
      ...endpoints.filter(ep => !healthyEndpoints.includes(ep))
    ];

    for (let i = 0; i < endpointsToTry.length; i++) {
      const endpoint = endpointsToTry[i];
      try {
        const result = await executeFunction(endpoint);
        // Mark endpoint as healthy
        this.markEndpointHealthy(chainName, endpoint);
        return result;
      } catch (error) {
        errors.push({
          endpoint,
          error: error.message,
          code: error.code,
        });

        // Mark endpoint as unhealthy if it's a rate limit or access denied
        if (this.isTemporaryError(error)) {
          this.markEndpointUnhealthy(chainName, endpoint);
        }

        // Continue to next endpoint if not the last one
        if (i < endpointsToTry.length - 1) {
          continue;
        }
      }
    }

    // All endpoints failed
    const errorMessage = `All RPC endpoints failed for ${chainName}: ${errors
      .map(e => `${e.endpoint} (${e.error})`)
      .join('; ')}`;
    const error = new Error(errorMessage);
    error.details = errors;
    throw error;
  }

  /**
   * Check if error is temporary (should mark endpoint unhealthy)
   * @param {Error} error
   * @returns {boolean}
   */
  isTemporaryError(error) {
    const message = error.message || '';
    const code = error.code;

    // Rate limit errors
    if (code === 429 || message.includes('429')) return true;

    // Access denied/forbidden errors
    if (code === 403 || message.includes('403')) return true;

    // Too many requests
    if (message.includes('too many requests')) return true;
    if (message.includes('rate limit')) return true;

    return false;
  }

  /**
   * Get healthy endpoints (not recently failed)
   * @param {string} chainName
   * @param {Array<string>} endpoints
   * @returns {Array<string>}
   */
  getHealthyEndpoints(chainName, endpoints) {
    const now = Date.now();
    return endpoints.filter(endpoint => {
      const status = this.endpointStatus.get(`${chainName}:${endpoint}`);
      if (!status) return true;

      // Endpoint is healthy if it's been longer than retryDelay since it failed
      if (status.isHealthy === false) {
        if (now - status.lastFailedAt > this.retryDelay) {
          return true; // Try again after delay
        }
        return false;
      }

      return true;
    });
  }

  /**
   * Mark endpoint as healthy
   * @param {string} chainName
   * @param {string} endpoint
   */
  markEndpointHealthy(chainName, endpoint) {
    this.endpointStatus.set(`${chainName}:${endpoint}`, {
      isHealthy: true,
      lastCheckedAt: Date.now(),
    });
  }

  /**
   * Mark endpoint as unhealthy
   * @param {string} chainName
   * @param {string} endpoint
   */
  markEndpointUnhealthy(chainName, endpoint) {
    this.endpointStatus.set(`${chainName}:${endpoint}`, {
      isHealthy: false,
      lastFailedAt: Date.now(),
    });
  }

  /**
   * Reset all endpoint statuses
   */
  resetStatus() {
    this.endpointStatus.clear();
  }

  /**
   * Get endpoint status for debugging
   * @param {string} chainName
   * @param {Array<string>} endpoints
   * @returns {Object}
   */
  getStatus(chainName, endpoints) {
    const status = {};
    endpoints.forEach(endpoint => {
      const key = `${chainName}:${endpoint}`;
      status[endpoint] = this.endpointStatus.get(key) || {
        isHealthy: true,
        lastCheckedAt: null,
      };
    });
    return status;
  }
}

// Export singleton instance
export const rpcEndpointManager = new RpcEndpointManager();
