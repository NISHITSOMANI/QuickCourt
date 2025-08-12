const { logger } = require('../config/logger');
const cache = require('../config/cache');

class DistributedLock {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Acquire a lock
   * @param {string} key - Lock key
   * @param {number} ttl - Time to live in milliseconds
   * @param {number} retryDelay - Delay between retries in milliseconds
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<boolean>} - True if lock was acquired, false otherwise
   */
  async acquireLock(key, ttl = 10000, retryDelay = 100, maxRetries = 10) {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now() + ttl;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const currentLock = cache.get(lockKey);
        
        // If no lock exists or lock has expired
        if (!currentLock || currentLock < Date.now()) {
          // Set the lock with TTL
          cache.set(lockKey, lockValue, { ttl: ttl / 1000 }); // Convert to seconds for cache
          return true;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        logger.error(`Error acquiring lock ${key}:`, error);
        throw error;
      }
    }
    
    return false; // Max retries reached
  }

  /**
   * Release a lock
   * @param {string} key - Lock key
   * @returns {Promise<boolean>} - True if lock was released, false otherwise
   */
  async releaseLock(key) {
    const lockKey = `lock:${key}`;
    try {
      cache.del(lockKey);
      return true;
    } catch (error) {
      logger.error(`Error releasing lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   * @param {string} key - Lock key
   * @param {Function} fn - Function to execute
   * @param {Object} options - Options
   * @param {number} [options.ttl=10000] - Lock time to live in milliseconds
   * @param {number} [options.retryDelay=100] - Delay between retries in milliseconds
   * @param {number} [options.maxRetries=10] - Maximum number of retry attempts
   * @param {boolean} [options.throwOnFail=true] - Whether to throw if lock cannot be acquired
   * @returns {Promise<*>} - Result of the function
   */
  async withLock(key, fn, options = {}) {
    const {
      ttl = 10000,
      retryDelay = 100,
      maxRetries = 10,
      throwOnFail = true
    } = options;

    const lockAcquired = await this.acquireLock(key, ttl, retryDelay, maxRetries);

    if (!lockAcquired) {
      if (throwOnFail) {
        throw new Error(`Could not acquire lock for key: ${key}`);
      }
      return null;
    }

    try {
      const result = await fn();
      return result;
    } finally {
      await this.releaseLock(key).catch(error => {
        logger.error(`Error releasing lock ${key}:`, error);
      });
    }
  }
}

// Create a singleton instance
const distributedLock = new DistributedLock();

module.exports = distributedLock;
