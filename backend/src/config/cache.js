const { LRUCache } = require('lru-cache');
const config = require('./env');
const { logger } = require('./logger');

class CacheService {
  constructor() {
    this.cache = new LRUCache({
      max: config.cache.maxSize,
      ttl: config.cache.ttlSeconds * 1000,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    logger.info('Cache service initialized with LRU cache', {
      maxSize: config.cache.maxSize,
      ttlSeconds: config.cache.ttlSeconds,
    });
  }

  async get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.stats.hits++;
        logger.debug(`Cache hit for key: ${key}`);
        return value;
      }

      this.stats.misses++;
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const options = {};
      if (ttl) {
        options.ttl = ttl * 1000; // Convert to milliseconds
      }

      this.cache.set(key, value, options);
      this.stats.sets++;
      logger.debug(`Cache set for key: ${key}`, { ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
        logger.debug(`Cache delete for key: ${key}`);
      }
      return deleted;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async has(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error('Cache has error:', error);
      return false;
    }
  }

  async clear() {
    try {
      this.cache.clear();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  async getOrSet(key, fetchFunction, ttl = null) {
    try {
      let value = await this.get(key);

      if (value !== null) {
        return value;
      }

      value = await fetchFunction();

      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      return await fetchFunction();
    }
  }

  healthCheck() {
    try {
      const testKey = 'health-check';
      const testValue = Date.now();

      this.cache.set(testKey, testValue);
      const retrieved = this.cache.get(testKey);
      this.cache.delete(testKey);

      return {
        status: retrieved === testValue ? 'healthy' : 'unhealthy',
        stats: this.getStats(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
