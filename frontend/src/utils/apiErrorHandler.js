import toast from 'react-hot-toast';

/**
 * Standardized API error handler for the application
 * @param {Error} error - The error object from an API call
 * @param {Object} options - Configuration options
 * @param {boolean} [options.showToast=true] - Whether to show error toasts
 * @param {Function} [options.onError] - Custom error handler function
 * @param {string} [options.defaultMessage] - Default error message if none is provided
 * @returns {Object} - Standardized error object
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    onError,
    defaultMessage = 'An error occurred. Please try again.',
  } = options;

  // Initialize error object with defaults
  const errorInfo = {
    status: 500,
    message: defaultMessage,
    code: 'UNKNOWN_ERROR',
    errors: null,
    timestamp: new Date().toISOString(),
    originalError: error,
  };

  // Handle different error types
  if (error?.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    errorInfo.status = status;
    errorInfo.message = data?.message || defaultMessage;
    errorInfo.code = data?.code || `HTTP_${status}`;
    errorInfo.errors = data?.errors || null;

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - clear auth tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      errorInfo.message = 'Your session has expired. Please log in again.';
      errorInfo.requiresAuth = true;
    } else if (status === 403) {
      errorInfo.message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      errorInfo.message = 'The requested resource was not found.';
    } else if (status >= 500) {
      errorInfo.message = 'A server error occurred. Please try again later.';
    }
  } else if (error?.request) {
    // The request was made but no response was received
    errorInfo.status = 0;
    errorInfo.code = 'NETWORK_ERROR';
    errorInfo.message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error?.code === 'ECONNABORTED') {
    // Request timeout
    errorInfo.status = 408;
    errorInfo.code = 'REQUEST_TIMEOUT';
    errorInfo.message = 'Request timed out. Please try again.';
  } else if (error instanceof Error) {
    // Generic error
    errorInfo.message = error.message || defaultMessage;
    errorInfo.code = error.code || 'UNKNOWN_ERROR';
  }

  // Show toast if enabled and we're not in test environment
  if (showToast && process.env.NODE_ENV !== 'test') {
    // Don't show toasts for 401 (handled by redirect) or 422 (validation errors)
    if (errorInfo.status !== 401 && errorInfo.status !== 422) {
      toast.error(errorInfo.message);
    }
  }

  // Call custom error handler if provided
  if (typeof onError === 'function') {
    onError(errorInfo);
  }

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      ...errorInfo,
      stack: error?.stack,
    });
  }

  return errorInfo;
};

/**
 * Higher-order function to create an error boundary for async functions
 * @param {Function} asyncFunction - The async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} - Wrapped async function with error handling
 */
export const withErrorHandling = (asyncFunction, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      return handleApiError(error, options);
    }
  };
};

/**
 * Hook for handling API errors in React components
 * @returns {Function} - Error handler function
 */
export const useApiErrorHandler = () => {
  const navigate = useNavigate();
  
  return (error, options = {}) => {
    const errorInfo = handleApiError(error, {
      ...options,
      onError: (error) => {
        // Handle navigation for 401 errors
        if (error.status === 401) {
          navigate('/login', { 
            state: { from: window.location.pathname },
            replace: true 
          });
        }
        
        // Call custom onError if provided
        if (typeof options.onError === 'function') {
          options.onError(error);
        }
      },
    });
    
    return errorInfo;
  };
};
