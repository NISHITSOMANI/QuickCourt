/**
 * API Rate Limiter Utility
 * 
 * This utility provides client-side rate limiting and throttling for API requests
 * to prevent hitting rate limits and handle 429 (Too Many Requests) responses.
 */

/**
 * Default rate limiting configuration
 */
const defaultConfig = {
  // Maximum number of requests allowed per windowMs
  maxRequests: 60,
  
  // Time window in milliseconds
  windowMs: 60 * 1000, // 1 minute
  
  // Whether to enable rate limiting (can be disabled for testing)
  enabled: true,
  
  // Whether to automatically retry when rate limited
  autoRetry: true,
  
  // Maximum number of retry attempts when rate limited
  maxRetryAttempts: 3,
  
  // Initial delay before retrying (will be increased with backoff)
  retryDelay: 1000,
  
  // Maximum delay between retries
  maxRetryDelay: 30000,
  
  // Callback when rate limited
  onRateLimited: null,
  
  // Callback when retrying
  onRetryAttempt: null
};

class RateLimiter {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.requests = [];
    this.queue = [];
    this.isProcessingQueue = false;
    this.retryCounts = new Map();
  }

  /**
   * Check if a request should be rate limited
   * @param {string} key - The rate limit key (e.g., endpoint + user ID)
   * @returns {boolean} Whether the request should be allowed
   */
  isRateLimited(key = 'global') {
    if (!this.config.enabled) return false;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove old requests outside the current window
    this.requests = this.requests.filter(req => req.timestamp > windowStart);
    
    // Count requests in the current window
    const requestCount = this.requests.filter(req => req.key === key).length;
    
    return requestCount >= this.config.maxRequests;
  }

  /**
   * Record a request for rate limiting
   * @param {string} key - The rate limit key
   */
  recordRequest(key = 'global') {
    if (!this.config.enabled) return;
    
    const now = Date.now();
    this.requests.push({ key, timestamp: now });
    
    // Clean up old requests periodically
    if (this.requests.length > this.config.maxRequests * 2) {
      const windowStart = now - (this.config.windowMs * 2);
      this.requests = this.requests.filter(req => req.timestamp > windowStart);
    }
  }

  /**
   * Get the number of remaining requests in the current window
   * @param {string} key - The rate limit key
   * @returns {number} Number of remaining requests
   */
  getRemainingRequests(key = 'global') {
    if (!this.config.enabled) return Infinity;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const requestCount = this.requests
      .filter(req => req.key === key && req.timestamp > windowStart)
      .length;
    
    return Math.max(0, this.config.maxRequests - requestCount);
  }

  /**
   * Get the time until the rate limit resets
   * @param {string} key - The rate limit key
   * @returns {number} Time in milliseconds until reset
   */
  getTimeUntilReset(key = 'global') {
    if (!this.config.enabled) return 0;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const oldestRequest = this.requests
      .filter(req => req.key === key)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    if (!oldestRequest) return 0;
    
    return Math.max(0, (oldestRequest.timestamp + this.config.windowMs) - now);
  }

  /**
   * Process the request queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.queue.length > 0) {
      const { request, key, resolve, reject, retryCount = 0 } = this.queue[0];
      
      if (this.isRateLimited(key)) {
        // If rate limited, wait and try again later
        const delay = this.getTimeUntilReset(key) + 100; // Add small buffer
        
        if (this.config.onRateLimited) {
          this.config.onRateLimited({
            key,
            delay,
            remaining: this.getRemainingRequests(key),
            retryCount
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Remove the request from the queue
      this.queue.shift();
      
      try {
        // Record the request for rate limiting
        this.recordRequest(key);
        
        // Execute the request
        const response = await request();
        
        // Reset retry count on success
        this.retryCounts.delete(key);
        
        resolve(response);
      } catch (error) {
        // Handle rate limit errors (status code 429)
        if (error.response && error.response.status === 429 && this.config.autoRetry) {
          const retryAfter = parseInt(error.response.headers['retry-after']) * 1000 || this.getRetryDelay(retryCount);
          
          if (retryCount < this.config.maxRetryAttempts) {
            // Add back to the queue with incremented retry count
            this.queue.unshift({
              request,
              key,
              resolve,
              reject,
              retryCount: retryCount + 1
            });
            
            if (this.config.onRetryAttempt) {
              this.config.onRetryAttempt({
                key,
                attempt: retryCount + 1,
                maxAttempts: this.config.maxRetryAttempts,
                delay: retryAfter
              });
            }
            
            // Wait before the next retry
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            continue;
          }
        }
        
        // If we get here, either we're not retrying or we've exceeded max retries
        reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Calculate the delay for the next retry attempt
   * @param {number} retryCount - Current retry attempt number
   * @returns {number} Delay in milliseconds
   */
  getRetryDelay(retryCount) {
    return Math.min(
      this.config.retryDelay * Math.pow(2, retryCount - 1),
      this.config.maxRetryDelay
    );
  }

  /**
   * Wrap an API request with rate limiting
   * @param {Function} requestFn - The API request function to wrap
   * @param {Object} options - Options for this request
   * @param {string} [options.key='global'] - Rate limit key
   * @param {boolean} [options.ignoreRateLimit=false] - Whether to ignore rate limiting
   * @returns {Promise} A promise that resolves with the API response
   */
  wrapRequest(requestFn, { key = 'global', ignoreRateLimit = false } = {}) {
    if (!this.config.enabled || ignoreRateLimit) {
      return requestFn();
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push({
        request: requestFn,
        key,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  /**
   * Update the rate limit configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

/**
 * Axios interceptor for handling rate limiting
 * @param {Object} config - Axios request config
 * @returns {Object} Modified config
 */
const rateLimitInterceptor = (config) => {
  if (!config.rateLimit) return config;
  
  const { key = 'global', enabled = true } = config.rateLimit;
  
  if (!enabled) return config;
  
  // Add a transformRequest function to handle rate limiting
  const originalTransformRequest = config.transformRequest || [];
  
  config.transformRequest = [
    ...(Array.isArray(originalTransformRequest) 
      ? originalTransformRequest 
      : [originalTransformRequest]),
    
    // This will be called before the request is sent
    (data, headers) => {
      if (rateLimiter.isRateLimited(key)) {
        const delay = rateLimiter.getTimeUntilReset(key);
        
        if (rateLimiter.config.onRateLimited) {
          rateLimiter.config.onRateLimited({
            key,
            delay,
            remaining: rateLimiter.getRemainingRequests(key)
          });
        }
        
        const error = new Error(`Rate limit exceeded for key: ${key}`);
        error.status = 429;
        error.retryAfter = delay;
        throw error;
      }
      
      // Record the request
      rateLimiter.recordRequest(key);
      
      return data;
    }
  ];
  
  return config;
};

/**
 * Axios interceptor for handling 429 responses
 * @param {Error} error - Axios error
 * @returns {Promise} Promise that resolves when the request can be retried
 */
const rateLimitErrorInterceptor = async (error) => {
  const { config, response } = error;
  
  // Only handle 429 errors
  if (!config || !response || response.status !== 429) {
    return Promise.reject(error);
  }
  
  const retryAfter = parseInt(response.headers['retry-after']) * 1000 || 1000;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Retry the request
      resolve(axiosInstance(config));
    }, retryAfter);
  });
};

export {
  rateLimiter,
  rateLimitInterceptor,
  rateLimitErrorInterceptor,
  RateLimiter
};

export default rateLimiter;
