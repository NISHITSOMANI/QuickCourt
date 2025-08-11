import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/apiErrorHandler';

/**
 * Custom hook for making API requests with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @param {boolean} [options.initialLoading=false] - Initial loading state
 * @param {Function} [options.onSuccess] - Callback on successful request
 * @param {Function} [options.onError] - Callback on request error
 * @param {boolean} [options.showErrorToast=true] - Whether to show error toasts
 * @returns {Object} - Request state and handlers
 */
const useApiRequest = (apiFunction, options = {}) => {
  const {
    initialLoading = false,
    onSuccess,
    onError,
    showErrorToast = true,
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  /**
   * Execute the API request
   * @param {*} requestData - Data to pass to the API function
   * @param {Object} localOptions - Local options that override hook options
   * @returns {Promise} - The API response
   */
  const execute = useCallback(
    async (requestData, localOptions = {}) => {
      const {
        onSuccess: localOnSuccess,
        onError: localOnError,
        showErrorToast: localShowErrorToast = showErrorToast,
      } = localOptions;

      setIsLoading(true);
      setStatus('loading');
      setError(null);

      try {
        const response = await apiFunction(requestData);
        
        setData(response);
        setStatus('success');
        
        // Call success callbacks
        if (typeof onSuccess === 'function') {
          onSuccess(response, requestData);
        }
        if (typeof localOnSuccess === 'function') {
          localOnSuccess(response, requestData);
        }
        
        return response;
      } catch (error) {
        const errorInfo = handleApiError(error, {
          showToast: localShowErrorToast,
          onError: (error) => {
            setError(error);
            setStatus('error');
            
            // Call error callbacks
            if (typeof onError === 'function') {
              onError(error, requestData);
            }
            if (typeof localOnError === 'function') {
              localOnError(error, requestData);
            }
          },
        });
        
        // Re-throw the error for error boundaries or try/catch blocks
        throw errorInfo;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, showErrorToast]
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(initialLoading);
    setStatus('idle');
  }, [initialLoading]);

  return {
    // State
    data,
    error,
    isLoading,
    status,
    
    // Derived state
    isIdle: status === 'idle',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Actions
    execute,
    reset,
    setData, // Allow manual data updates
  };
};

export default useApiRequest;
