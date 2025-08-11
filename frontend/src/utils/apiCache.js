/**
 * API Response Caching Utility
 * 
 * This module provides a simple in-memory cache for API responses to improve
 * performance and reduce network requests. It supports:
 * - Time-based cache expiration
 - Automatic cache invalidation
 - Manual cache clearing
 - Cache key generation from request parameters
 */

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate a cache key from request configuration
 * @param {Object} config - Axios request config
 * @returns {string} Cache key
 */
const generateCacheKey = (config) => {
  const { url, method, params, data } = config;
  
  // Create a key based on the request details
  const keyParts = [
    method?.toLowerCase(),
    url,
    params ? JSON.stringify(params) : '',
    data && typeof data === 'object' ? JSON.stringify(data) : data
  ];
  
  return keyParts.join('|');
};

/**
 * Check if a cached response is still valid
 * @param {Object} cacheEntry - The cached entry
 * @returns {boolean} Whether the cache is still valid
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  
  const { timestamp, ttl = DEFAULT_TTL } = cacheEntry;
  return Date.now() - timestamp < ttl;
};

/**
 * Get a cached response if available and valid
 * @param {Object} config - Axios request config
 * @returns {Object|null} Cached response or null if not found/expired
 */
export const getCachedResponse = (config) => {
  const key = generateCacheKey(config);
  const cacheEntry = cache.get(key);
  
  if (cacheEntry && isCacheValid(cacheEntry)) {
    return cacheEntry.response;
  }
  
  // Remove expired cache entry
  if (cacheEntry) {
    cache.delete(key);
  }
  
  return null;
};

/**
 * Cache a response
 * @param {Object} config - Axios request config
 * @param {Object} response - Axios response
 * @param {number} [ttl] - Time to live in milliseconds
 */
export const cacheResponse = (config, response, ttl = DEFAULT_TTL) => {
  // Don't cache error responses
  if (response.status >= 400) {
    return;
  }
  
  // Don't cache POST/PUT/DELETE requests by default
  const method = config.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    // Invalidate related GET caches for the same resource
    if (method !== 'get') {
      const resource = config.url.split('?')[0];
      clearCacheForResource(resource);
    }
    return;
  }
  
  const key = generateCacheKey(config);
  
  cache.set(key, {
    response,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Clear the entire cache or a specific entry
 * @param {string} [key] - Optional cache key to clear
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Clear all cached responses for a specific resource
 * @param {string} resource - The resource URL to clear cache for
 */
export const clearCacheForResource = (resource) => {
  if (!resource) return;
  
  for (const [key] of cache.entries()) {
    if (key.includes(resource)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear all expired cache entries
 */
export const clearExpiredCache = () => {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > (entry.ttl || DEFAULT_TTL)) {
      cache.delete(key);
    }
  }
};

// Periodically clean up expired cache entries
setInterval(clearExpiredCache, 5 * 60 * 1000); // Every 5 minutes

/**
 * Axios request interceptor for caching
 */
export const cacheRequestInterceptor = (config) => {
  // Skip cache for non-GET requests or when explicitly disabled
  if (config.method?.toLowerCase() !== 'get' || config.noCache) {
    return config;
  }
  
  const cachedResponse = getCachedResponse(config);
  
  if (cachedResponse) {
    // Return the cached response and skip the actual request
    return {
      ...config,
      adapter: () => Promise.resolve({
        data: cachedResponse.data,
        status: 200,
        statusText: 'OK (from cache)',
        headers: {},
        config,
        isFromCache: true
      })
    };
  }
  
  return config;
};

/**
 * Axios response interceptor for caching
 */
export const cacheResponseInterceptor = (response) => {
  const { config } = response;
  
  // Only cache successful GET requests
  if (response.status === 200 && config.method?.toLowerCase() === 'get' && !config.noCache) {
    // Use custom TTL if provided in config
    const ttl = config.cacheTtl || DEFAULT_TTL;
    cacheResponse(config, response, ttl);
  }
  
  return response;
};

// Default export with all utility functions
export default {
  getCachedResponse,
  cacheResponse,
  clearCache,
  clearCacheForResource,
  clearExpiredCache,
  cacheRequestInterceptor,
  cacheResponseInterceptor
};
