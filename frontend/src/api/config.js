import axios from 'axios'
import { toast } from 'react-hot-toast'
import { authApi } from './authApi'
import { 
  cacheRequestInterceptor, 
  cacheResponseInterceptor 
} from '../utils/apiCache';
import { createRetryInterceptor } from '../utils/retryRequest';
import { createRequestLogger, createResponseLogger } from '../utils/apiLogger';
import { withCancellation } from '../utils/apiCancellation';
import { rateLimitInterceptor, rateLimitErrorInterceptor } from '../utils/apiRateLimiter';

// Environment configuration
const isDevelopment = import.meta.env.DEV
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Configure API logger in development
if (isDevelopment) {
  // You can customize logger configuration here
  // Example: configureLogger({ logLevel: LOG_LEVELS.DEBUG, logData: true });
}

// Create a base axios instance without interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true, // Important for cookies/sessions
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  validateStatus: function (status) {
    // Resolve only if the status code is less than 500
    return status < 500;
  }
});

// Create the main API instance with all interceptors
const api = { ...axiosInstance };

// Add all HTTP methods with cancellation support
['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch'].forEach(method => {
  api[method] = withCancellation(
    axiosInstance[method].bind(axiosInstance),
    { cancelPrevious: method.toLowerCase() === 'get' } // Only cancel previous GET requests by default
  );
});

// Add the original axios instance as a property for advanced usage
api.axiosInstance = axiosInstance;

// Configure the base axios instance with default settings
Object.assign(axiosInstance, {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
  retryOptions: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, delay, error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Retry attempt ${attempt} after ${delay}ms`, error.message);
      }
    }
  },
  
  // Add cancellation support to the config
  requestCancellation: {
    enabled: true,
    cancelOnUnmount: true,
    cancelPrevious: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    // Global rate limit (requests per minute)
    global: {
      maxRequests: 60,
      windowMs: 60 * 1000, // 1 minute
      enabled: true
    },
    
    // Per-endpoint rate limits
    endpoints: {
      // Example:
      // '/auth/login': {
      //   maxRequests: 5,
      //   windowMs: 60 * 1000, // 1 minute
      //   enabled: true
      // }
    },
    
    // Whether to enable rate limiting
    enabled: process.env.NODE_ENV === 'production',
    
    // Whether to show console warnings when rate limited
    logWarnings: process.env.NODE_ENV === 'development',
    
    // Callback when rate limited
    onRateLimited: (info) => {
      if (process.env.NODE_ENV === 'development' && console && console.warn) {
        console.warn(`Rate limited: ${info.key} - ${info.remaining} requests remaining`);
      }
    },
    
    // Callback when retrying a request
    onRetryAttempt: (info) => {
      if (process.env.NODE_ENV === 'development' && console && console.info) {
        console.info(`Retry attempt ${info.attempt} of ${info.maxAttempts} after ${info.delay}ms`);
      }
    }
  }
})

// Track if refresh token request is in progress
let isRefreshing = false
let refreshSubscribers = []

// Add to refresh subscribers
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb)
}

// Call all subscribers with new token
const onRrefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token))
  refreshSubscribers = []
}

/**
 * Attempt to refresh the access token
 */
const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise(resolve => {
      subscribeTokenRefresh(token => {
        resolve(token)
      })
    })
  }

  isRefreshing = true
  
  try {
    const response = await authApi.refreshToken()
    const { token } = response.data
    
    if (token) {
      localStorage.setItem('token', token)
      onRrefreshed(token)
      return token
    }
    
    throw new Error('No token received from refresh')
  } catch (error) {
    // Clear auth state on refresh failure
    localStorage.removeItem('token')
    window.location.href = '/login?session=expired'
    throw error
  } finally {
    isRefreshing = false
  }
}

/**
 * Request interceptor
 * - Add auth token to requests
 * - Handle content type for FormData
 * - Handle request caching
 */
const requestInterceptors = [
  // Cache interceptor
  (config) => {
    // Skip cache for non-GET requests or when explicitly disabled
    if (config.method?.toLowerCase() !== 'get' || config.noCache) {
      return config;
    }
    
    return cacheRequestInterceptor(config);
  },
  
  // Auth interceptor
  (config) => {
    // Skip for auth endpoints to prevent infinite loops
    if (config.url.includes('/auth/')) {
      return config;
    }

    // Get token from storage
    const token = localStorage.getItem('token')
    
    // Add auth header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Handle FormData - let the browser set the content-type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Add request timestamp to prevent caching
    config.headers['X-Request-Timestamp'] = Date.now()
    
    return config;
  }
];

// Add request interceptors to the axios instance (not the wrapped api object)
const retryInterceptors = createRetryInterceptor();
const requestLogger = createRequestLogger();

// Add retry interceptor
axiosInstance.interceptors.request.use(
  retryInterceptors.request[0],
  retryInterceptors.request[1]
);

// Add request logger interceptor
axiosInstance.interceptors.request.use(
  requestLogger.request[0],
  requestLogger.request[1]
);

// Add rate limiting interceptor
axiosInstance.interceptors.request.use(
  rateLimitInterceptor,
  error => Promise.reject(error)
);

// Add all other request interceptors
requestInterceptors.forEach(interceptor => {
  axiosInstance.interceptors.request.use(interceptor, (error) => {
    return Promise.reject(error);
  });
});

/**
 * Response interceptor
 * - Handle response caching
 * - Handle token refresh
 * - Global error handling
 */
// Add response interceptors to the axios instance
const responseLogger = createResponseLogger();

// Add retry interceptor for responses
axiosInstance.interceptors.response.use(
  retryInterceptors.response[0],
  retryInterceptors.response[1]
);

// Add response logger interceptor
axiosInstance.interceptors.response.use(
  responseLogger.response[0],
  responseLogger.response[1]
);

// Add rate limit error interceptor
axiosInstance.interceptors.response.use(
  response => response,
  rateLimitErrorInterceptor
);

// Response interceptors
axiosInstance.interceptors.response.use(
  // Success handler
  (response) => {
    // Only cache successful GET responses that aren't from cache
    if (response.status === 200 && 
        response.config.method?.toLowerCase() === 'get' && 
        !response.config.noCache &&
        !response.isFromCache) {
      return cacheResponseInterceptor(response);
    }
    return response.data;
  },
  
  // Error handler
  async (error) => {
    const originalRequest = error.config
    const { response } = error
    
    // Don't show network errors in development
    if (isDevelopment) {
      console.warn('API Error:', error.message)
      return Promise.reject(error)
    }

    // Handle network errors
    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401 && !originalRequest._retry) {
      // If this is a login request, don't try to refresh
      if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error)
      }
      
      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true
      
      try {
        // Try to refresh the token
        const newToken = await refreshToken()
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login?session=expired'
        return Promise.reject(refreshError)
      }
    }

    // Handle other error status codes
    const errorMessage = response.data?.message || 'An error occurred. Please try again.'
    
    // Show error toast if this isn't a validation error
    if (response.status !== 422) {
      toast.error(errorMessage)
    }
    
    // For 403 Forbidden, redirect to home page
    if (response.status === 403) {
      window.location.href = '/?error=forbidden'
    }
    
    // For 404 Not Found, log but don't show a toast
    if (response.status === 404) {
      console.warn('Resource not found:', originalRequest.url)
    }
    
    return Promise.reject({
      status: response.status,
      message: errorMessage,
      errors: response.data?.errors,
      code: response.data?.code,
      timestamp: new Date().toISOString()
    })
  }
)

// Add clearPendingRequests function to the api instance
api.clearPendingRequests = () => {
  // This will cancel all pending requests when called
  // The actual implementation would cancel any pending requests
  console.log('Clearing pending requests');
  // Note: If you need actual request cancellation, you'll need to implement
  // a request cancellation map and use it here
};

// Export the configured axios instance
export { api as default, api }
