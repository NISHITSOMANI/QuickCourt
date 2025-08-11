const LRU = require('lru-cache');
const config = require('../config/env');
const { logBusiness, logError } = require('../config/logger');

class CacheService {
    constructor() {
        this.cache = null;
        this.isConnected = false;
        this.defaultTTL = 3600000; // 1 hour default TTL in milliseconds
    }

    /**
     * Initialize LRU cache
     */
    async init() {
        try {
            // Create LRU cache with configuration
            const cacheConfig = {
                max: config.cache?.maxItems || 1000, // Maximum number of items
                ttl: this.defaultTTL, // Default TTL in milliseconds
                allowStale: false,
                updateAgeOnGet: false,
                updateAgeOnHas: false,
            };

            this.cache = new LRU(cacheConfig);
            this.isConnected = true;

            logBusiness.info('Cache service initialized successfully with LRU cache');
            logBusiness.info(`Cache configuration: max=${cacheConfig.max}, defaultTTL=${this.defaultTTL}ms`);
        } catch (error) {
            logError.error('Failed to initialize cache service:', error);
            // Don't throw error to prevent app crash - graceful degradation
            this.isConnected = false;
        }
    }

    /**
     * Check if cache is available
     */
    isAvailable() {
        return this.isConnected && this.cache;
    }

    /**
     * Set a value in cache
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping set operation');
            return false;
        }

        try {
            // Convert TTL from seconds to milliseconds if needed
            const ttlMs = ttl < 1000000 ? ttl * 1000 : ttl;
            this.cache.set(key, value, { ttl: ttlMs });
            logBusiness.debug(`Cache set: ${key} (TTL: ${ttlMs}ms)`);
            return true;
        } catch (error) {
            logError.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get a value from cache
     */
    async get(key) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping get operation');
            return null;
        }

        try {
            const value = this.cache.get(key);
            if (value === undefined) {
                logBusiness.debug(`Cache miss: ${key}`);
                return null;
            }

            logBusiness.debug(`Cache hit: ${key}`);
            return value;
        } catch (error) {
            logError.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Delete a key from cache
     */
    async del(key) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping delete operation');
            return false;
        }

        try {
            const result = this.cache.delete(key);
            logBusiness.debug(`Cache delete: ${key} (deleted: ${result})`);
            return result;
        } catch (error) {
            logError.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Check if a key exists in cache
     */
    async exists(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const result = this.cache.has(key);
            return result;
        } catch (error) {
            logError.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Set expiration time for a key (not directly supported in LRU, but we can re-set with new TTL)
     */
    async expire(key, ttl) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const value = this.cache.get(key);
            if (value !== undefined) {
                const ttlMs = ttl < 1000000 ? ttl * 1000 : ttl;
                this.cache.set(key, value, { ttl: ttlMs });
                logBusiness.debug(`Cache expire: ${key} (TTL: ${ttlMs}ms)`);
                return true;
            }
            return false;
        } catch (error) {
            logError.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     */
    async mget(keys) {
        if (!this.isAvailable() || !keys.length) {
            return [];
        }

        try {
            const values = keys.map(key => {
                const value = this.cache.get(key);
                return value !== undefined ? value : null;
            });
            return values;
        } catch (error) {
            logError.error('Cache mget error:', error);
            return new Array(keys.length).fill(null);
        }
    }

    /**
     * Set multiple key-value pairs
     */
    async mset(keyValuePairs, ttl = this.defaultTTL) {
        if (!this.isAvailable() || !keyValuePairs.length) {
            return false;
        }

        try {
            const ttlMs = ttl < 1000000 ? ttl * 1000 : ttl;

            for (const [key, value] of keyValuePairs) {
                this.cache.set(key, value, { ttl: ttlMs });
            }

            logBusiness.debug(`Cache mset: ${keyValuePairs.length} keys`);
            return true;
        } catch (error) {
            logError.error('Cache mset error:', error);
            return false;
        }
    }

    /**
     * Clear all cache (use with caution)
     */
    async flush() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            this.cache.clear();
            logBusiness.warn('Cache flushed - all keys deleted');
            return true;
        } catch (error) {
            logError.error('Cache flush error:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            return {
                connected: this.isConnected,
                size: this.cache.size,
                max: this.cache.max,
                calculatedSize: this.cache.calculatedSize,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError.error('Cache stats error:', error);
            return null;
        }
    }

    /**
     * Cache wrapper function for easy use with async functions
     */
    async wrap(key, fn, ttl = this.defaultTTL) {
        try {
            // Try to get from cache first
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }

            // If not in cache, execute function
            const result = await fn();

            // Store result in cache
            await this.set(key, result, ttl);

            return result;
        } catch (error) {
            logError.error(`Cache wrap error for key ${key}:`, error);
            // If cache fails, still execute the function
            return await fn();
        }
    }

    /**
     * Generate cache key with prefix
     */
    generateKey(prefix, ...parts) {
        return `quickcourt:${prefix}:${parts.join(':')}`;
    }

    /**
     * Close cache service
     */
    async close() {
        if (this.cache) {
            try {
                this.cache.clear();
                this.cache = null;
                this.isConnected = false;
                logBusiness.info('Cache service closed');
            } catch (error) {
                logError.error('Error closing cache service:', error);
            }
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
