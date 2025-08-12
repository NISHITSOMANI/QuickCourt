const LRU = require('lru-cache');
const config = require('../config/env');
const { logBusiness, logError } = require('../config/logger');
const ServiceCircuitBreaker = require('../utils/circuitBreaker');

class CacheService {
    constructor() {
        this.cache = null;
        this.isConnected = false;
        this.defaultTTL = 3600000; // 1 hour default TTL in milliseconds
        
        // Initialize circuit breakers for critical operations
        this.circuitBreaker = new ServiceCircuitBreaker(
            'cache-service',
            this._executeCacheOperation.bind(this),
            { 
                timeout: 1000, // 1s timeout for cache operations
                errorThresholdPercentage: 50, // Trip circuit if 50% of requests fail
                resetTimeout: 30000, // 30 seconds before attempting to close the circuit
            }
        );
        
        // Track if we're in a degraded state
        this.degradedMode = false;
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
     * Internal method to execute cache operations with circuit breaker
     */
    async _executeCacheOperation(operation, ...args) {
        const [key, value, ttl] = args;
        
        if (!this.isAvailable()) {
            throw new Error('Cache not available');
        }

        try {
            switch (operation) {
                case 'set': {
                    const ttlMs = ttl < 1000000 ? ttl * 1000 : ttl;
                    this.cache.set(key, value, { ttl: ttlMs });
                    logBusiness.debug(`Cache set: ${key} (TTL: ${ttlMs}ms)`);
                    return true;
                }
                case 'get': {
                    const value = this.cache.get(key);
                    if (value === undefined) {
                        logBusiness.debug(`Cache miss: ${key}`);
                        return null;
                    }
                    logBusiness.debug(`Cache hit: ${key}`);
                    return value;
                }
                case 'delete': {
                    const result = this.cache.delete(key);
                    logBusiness.debug(`Cache delete: ${key} (deleted: ${result})`);
                    return result;
                }
                case 'exists': {
                    return this.cache.has(key);
                }
                default:
                    throw new Error(`Unsupported cache operation: ${operation}`);
            }
        } catch (error) {
            logError.error(`Cache ${operation} error for key ${key}:`, error);
            throw error; // Let the circuit breaker handle the error
        }
    }

    /**
     * Set a value in cache with circuit breaker protection
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping set operation');
            return false;
        }

        try {
            return await this.circuitBreaker.execute('set', key, value, ttl);
        } catch (error) {
            if (!this.degradedMode) {
                logBusiness.warn('Cache operation failed, entering degraded mode', { error: error.message });
                this.degradedMode = true;
                // Schedule to exit degraded mode after 5 minutes
                setTimeout(() => {
                    this.degradedMode = false;
                    logBusiness.info('Exiting cache degraded mode');
                }, 5 * 60 * 1000);
            }
            return false; // Graceful degradation - return false instead of throwing
        }
    }

    /**
     * Get a value from cache with circuit breaker protection
     */
    async get(key) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping get operation');
            return null;
        }

        try {
            return await this.circuitBreaker.execute('get', key);
        } catch (error) {
            logError.error(`Cache get error for key ${key}:`, error);
            return null; // Graceful degradation - return null on error
        }
    }

    /**
     * Delete a key from cache with circuit breaker protection
     */
    async del(key) {
        if (!this.isAvailable()) {
            logBusiness.warn('Cache not available, skipping delete operation');
            return false;
        }

        try {
            return await this.circuitBreaker.execute('delete', key);
        } catch (error) {
            logError.error(`Cache delete error for key ${key}:`, error);
            return false; // Graceful degradation - return false on error
        }
    }

    /**
     * Check if a key exists in cache with circuit breaker protection
     */
    async exists(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            return await this.circuitBreaker.execute('exists', key);
        } catch (error) {
            logError.error(`Cache exists error for key ${key}:`, error);
            return false; // Graceful degradation - return false on error
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
     * Get cache statistics including circuit breaker state
     */
    async getStats() {
        if (!this.isAvailable()) {
            return {
                connected: false,
                degradedMode: this.degradedMode,
                error: 'Cache not available',
                timestamp: new Date().toISOString()
            };
        }

        try {
            return {
                connected: this.isConnected,
                degradedMode: this.degradedMode,
                size: this.cache.size,
                max: this.cache.max,
                calculatedSize: this.cache.calculatedSize,
                circuitBreaker: this.circuitBreaker ? this.circuitBreaker.getStats() : 'not_initialized',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError.error('Cache stats error:', error);
            return {
                connected: false,
                degradedMode: true,
                error: error.message,
                timestamp: new Date().toISOString()
            };
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
