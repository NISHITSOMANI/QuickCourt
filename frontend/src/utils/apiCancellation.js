import axios from 'axios';

// Create a local reference to axios to ensure it's available in all scopes
const axiosInstance = axios;

/**
 * API Request Cancellation Utility
 * 
 * This utility provides a way to cancel in-flight API requests when they're no longer needed.
 * It's particularly useful for:
 * - Cancelling requests when a component unmounts
 * - Cancelling previous requests when making a new request
 * - Preventing memory leaks from abandoned requests
 */

class RequestCanceler {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Generate a unique key for a request
   * @param {string} url - The request URL
   * @param {string} method - The HTTP method (GET, POST, etc.)
   * @param {Object} [params] - Request parameters
   * @returns {string} A unique key for the request
   */
  generateKey(url, method, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${method.toUpperCase()}:${url}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Add a cancel token to track a request
   * @param {string} key - The request key
   * @param {Function} cancel - The cancel function from axios CancelToken
   */
  addRequest(key, cancel) {
    // Cancel any existing request with the same key
    this.cancelRequest(key, 'A new request was made');
    
    // Add the new request
    this.pendingRequests.set(key, cancel);
  }

  /**
   * Remove a request from tracking
   * @param {string} key - The request key
   */
  removeRequest(key) {
    this.pendingRequests.delete(key);
  }

  /**
   * Cancel a specific request
   * @param {string} key - The request key
   * @param {string} [message] - Optional cancellation message
   */
  cancelRequest(key, message = 'Request was cancelled') {
    const cancel = this.pendingRequests.get(key);
    if (cancel) {
      cancel(message);
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   * @param {string} [message] - Optional cancellation message
   */
  cancelAllRequests(message = 'All requests were cancelled') {
    this.pendingRequests.forEach((cancel, key) => {
      cancel(message);
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Create a cancel token and track the request
   * @param {string} key - The request key
   * @returns {Object} An object with the cancel token and a function to clean up the request
   */
  createCancelToken(key) {
    const source = axiosInstance.CancelToken.source();
    
    this.addRequest(key, source.cancel);
    
    return {
      cancelToken: source.token,
      cleanup: () => this.removeRequest(key)
    };
  }

  /**
   * Create a cancel token for a specific request
   * @param {string} url - The request URL
   * @param {string} method - The HTTP method
   * @param {Object} [params] - Request parameters
   * @returns {Object} An object with the cancel token and a function to clean up the request
   */
  createRequestCancelToken(url, method, params = {}) {
    const key = this.generateKey(url, method, params);
    return {
      ...this.createCancelToken(key),
      key
    };
  }
}

// Create a singleton instance
const requestCanceler = new RequestCanceler();

/**
 * Higher-order function to create a cancellable API request
 * @param {Function} apiFunction - The API function to make cancellable
 * @param {Object} options - Options for the request
 * @param {string} [options.key] - Optional custom key for the request
 * @param {boolean} [options.cancelPrevious=true] - Whether to cancel previous requests with the same key
 * @returns {Function} A function that can be called to execute the request
 */
const withCancellation = (apiFunction, options = {}) => {
  const { key, cancelPrevious = true } = options;
  
  return async (params = {}, config = {}) => {
    // Generate a key for this request if not provided
    const requestKey = key || requestCanceler.generateKey(
      config.url || '',
      config.method || 'GET',
      params
    );
    
    // Create a cancel token for this request
    const { cancelToken, cleanup } = requestCanceler.createCancelToken(requestKey);
    
    try {
      // Execute the API function with the cancel token
      const response = await apiFunction(params, {
        ...config,
        cancelToken
      });
      
      // Clean up the request
      cleanup();
      
      return response;
    } catch (error) {
      // Don't treat cancellation as an error
      if (axios.isCancel(error)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Request cancelled:', error.message);
        }
        return null;
      }
      
      // Clean up the request if it wasn't cancelled
      cleanup();
      
      // Re-throw the error for the caller to handle
      throw error;
    }
  };
};

/**
 * React hook to cancel requests when a component unmounts
 * @param {Array} [requestKeys] - Optional array of request keys to cancel
 * @returns {Function} A function to add request keys to be cancelled on unmount
 */
const useRequestCancellation = (requestKeys = []) => {
  const requestRef = useRef({
    keys: new Set(requestKeys)
  });
  
  // Add a request key to be cancelled on unmount
  const addRequestKey = useCallback((key) => {
    if (key) {
      requestRef.current.keys.add(key);
    }
  }, []);
  
  // Clean up function to cancel all tracked requests
  const cancelRequests = useCallback((message = 'Component unmounted') => {
    requestRef.current.keys.forEach(key => {
      requestCanceler.cancelRequest(key, message);
    });
    requestRef.current.keys.clear();
  }, []);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequests();
    };
  }, [cancelRequests]);
  
  return {
    addRequestKey,
    cancelRequests,
    generateKey: requestCanceler.generateKey.bind(requestCanceler)
  };
};

export {
  requestCanceler,
  withCancellation,
  useRequestCancellation
};

export default requestCanceler;
