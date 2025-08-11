/**
 * Utility for retrying failed API requests with exponential backoff
 * 
 * This utility provides a way to automatically retry failed API requests
 * with an exponential backoff strategy. It's particularly useful for handling
 * transient network errors or temporary server issues.
 */

/**
 * Default retry configuration
 */
const defaultOptions = {
  // Maximum number of retry attempts
  maxRetries: 3,
  
  // Initial delay in milliseconds (will be doubled after each retry)
  initialDelay: 1000,
  
  // Maximum delay between retries in milliseconds
  maxDelay: 10000,
  
  // Status codes that should trigger a retry
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // HTTP methods that are safe to retry
  retryMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  
  // Function to determine if a request should be retried
  shouldRetry: null,
  
  // Function to be called before each retry attempt
  onRetry: null,
};

/**
 * Calculate the delay for the next retry attempt
 * @param {number} attempt - Current attempt number (1-based)
 * @param {Object} options - Retry options
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, options) => {
  const { initialDelay, maxDelay } = options;
  // Exponential backoff with jitter
  const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
  // Add jitter to avoid thundering herd problem
  return delay * 0.5 * (1 + Math.random());
};

/**
 * Check if a request should be retried based on the error
 * @param {Error} error - The error from the API request
 * @param {Object} options - Retry options
 * @returns {boolean} Whether to retry the request
 */
const shouldRetryRequest = (error, options) => {
  const { retryStatusCodes, retryMethods, shouldRetry } = options;
  const { response, config } = error;
  
  // Check if a custom shouldRetry function is provided
  if (typeof shouldRetry === 'function') {
    return shouldRetry(error);
  }
  
  // Don't retry if there's no config (not an axios error)
  if (!config) {
    return false;
  }
  
  // Don't retry if the method is not in the retryMethods array
  const method = config.method?.toUpperCase();
  if (!retryMethods.includes(method)) {
    return false;
  }
  
  // Don't retry if explicitly disabled in the request config
  if (config.noRetry) {
    return false;
  }
  
  // Retry on network errors (no response)
  if (!response) {
    return true;
  }
  
  // Check if the status code is in the retry list
  return retryStatusCodes.includes(response.status);
};

/**
 * Create a retryable version of an async function
 * @param {Function} fn - The async function to make retryable
 * @param {Object} userOptions - Retry options
 * @returns {Function} A function that will automatically retry on failure
 */
const createRetryableRequest = (fn, userOptions = {}) => {
  const options = { ...defaultOptions, ...userOptions };
  
  return async (...args) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        // Try to execute the function
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (attempt >= options.maxRetries || !shouldRetryRequest(error, options)) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = calculateDelay(attempt, options);
        
        // Call the onRetry callback if provided
        if (typeof options.onRetry === 'function') {
          options.onRetry(attempt, delay, error);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retry attempts failed
    throw lastError;
  };
};

/**
 * Create a retryable version of an Axios instance
 * @param {Object} axiosInstance - The Axios instance to make retryable
 * @param {Object} options - Retry options
 * @returns {Object} The enhanced Axios instance with retry support
 */
const withRetry = (axiosInstance, options = {}) => {
  const retryableInstance = { ...axiosInstance };
  
  // Create a retryable version of each request method
  ['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch'].forEach(method => {
    if (typeof axiosInstance[method] === 'function') {
      retryableInstance[method] = createRetryableRequest(axiosInstance[method].bind(axiosInstance), options);
    }
  });
  
  return retryableInstance;
};

/**
 * Axios interceptor factory for retry functionality
 * @param {Object} options - Retry options
 * @returns {Object} Axios interceptor configuration
 */
const createRetryInterceptor = (options = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    request: [
      (config) => {
        // Skip retry if explicitly disabled
        if (config.noRetry) {
          return config;
        }
        
        // Add retry config to the request
        return {
          ...config,
          retryCount: 0,
          retryOptions: { ...mergedOptions, ...(config.retryOptions || {}) }
        };
      },
      (error) => Promise.reject(error)
    ],
    response: [
      (response) => response,
      async (error) => {
        const { config, response } = error;
        
        // If no config, it's not an axios error we can retry
        if (!config) {
          return Promise.reject(error);
        }
        
        // Get retry options, with request-specific options taking precedence
        const retryOptions = config.retryOptions || mergedOptions;
        
        // Check if we should retry this error
        if (!shouldRetryRequest(error, retryOptions)) {
          return Promise.reject(error);
        }
        
        // Increment retry count
        config.retryCount = (config.retryCount || 0) + 1;
        
        // Check if we've exceeded max retries
        if (config.retryCount > (retryOptions.maxRetries || defaultOptions.maxRetries)) {
          return Promise.reject(error);
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = calculateDelay(config.retryCount, retryOptions);
        
        // Call the onRetry callback if provided
        if (typeof retryOptions.onRetry === 'function') {
          retryOptions.onRetry(config.retryCount, delay, error);
        }
        
        // Create a new promise to handle the retry
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(axiosInstance(config));
          }, delay);
        });
      }
    ]
  };
};

export {
  createRetryableRequest,
  withRetry,
  createRetryInterceptor,
  defaultOptions as retryOptions
};

export default createRetryableRequest;
