/**
 * API Request/Response Logger
 * 
 * This utility provides consistent logging for API requests and responses.
 * It's useful for debugging and monitoring API interactions in development.
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  NONE: 'none'
};

// Default configuration
const defaultConfig = {
  // Minimum log level to output (one of LOG_LEVELS)
  logLevel: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
  
  // Whether to log request/response data
  logData: true,
  
  // Maximum length of data to log (to avoid huge logs)
  maxDataLength: 5000,
  
  // Whether to log to console in development
  logToConsole: process.env.NODE_ENV !== 'test',
  
  // Custom logger function (if not using console)
  logger: null
};

// Current configuration
let config = { ...defaultConfig };

/**
 * Truncate a string if it exceeds the maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
const truncate = (str, maxLength) => {
  if (typeof str !== 'string' || str.length <= maxLength) {
    return str;
  }
  return `${str.substring(0, maxLength)}... [truncated]`;
};

/**
 * Format a value for logging
 * @param {*} value - The value to format
 * @returns {string} Formatted string
 */
const formatValue = (value) => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  
  try {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  } catch (error) {
    return `[Error stringifying value: ${error.message}]`;
  }
};

/**
 * Log a message with the specified level
 * @param {string} level - Log level (one of LOG_LEVELS)
 * @param {string} message - The message to log
 * @param {*} [data] - Optional data to log
 */
const log = (level, message, data = null) => {
  // Skip if log level is not high enough
  const levelPriority = Object.values(LOG_LEVELS).indexOf(level);
  const minLevelPriority = Object.values(LOG_LEVELS).indexOf(config.logLevel);
  
  if (levelPriority < minLevelPriority) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Add data if provided and logging is enabled
  if (data !== null && data !== undefined && config.logData) {
    const formattedData = formatValue(data);
    const truncatedData = truncate(formattedData, config.maxDataLength);
    logMessage += `\n${truncatedData}`;
  }
  
  // Log to console in development
  if (config.logToConsole) {
    const logMethod = console[level] || console.log;
    logMethod(logMessage);
  }
  
  // Use custom logger if provided
  if (typeof config.logger === 'function') {
    config.logger(level, message, data);
  }
};

/**
 * Configure the API logger
 * @param {Object} newConfig - Configuration options
 */
export const configureLogger = (newConfig) => {
  config = { ...config, ...newConfig };
};

/**
 * Reset logger configuration to defaults
 */
export const resetLogger = () => {
  config = { ...defaultConfig };
};

/**
 * Log an API request
 * @param {Object} config - Axios request config
 */
export const logRequest = (config) => {
  const { method, url, params, data, headers } = config;
  
  log(LOG_LEVELS.DEBUG, `API Request: ${method?.toUpperCase()} ${url}`, {
    params,
    headers,
    data: data && Object.keys(data).length > 0 ? data : undefined
  });
};

/**
 * Log an API response
 * @param {Object} response - Axios response
 */
export const logResponse = (response) => {
  const { config, status, statusText, data, headers } = response;
  const { method, url } = config || {};
  
  log(LOG_LEVELS.DEBUG, `API Response: ${status} ${statusText} ${method?.toUpperCase()} ${url}`, {
    status,
    statusText,
    headers,
    data: data && Object.keys(data).length > 0 ? data : undefined
  });
  
  return response;
};

/**
 * Log an API error
 * @param {Error} error - The error that occurred
 */
export const logError = (error) => {
  if (!error) return;
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, statusText, config, data } = error.response;
    const { method, url } = config || {};
    
    log(LOG_LEVELS.ERROR, `API Error: ${status} ${statusText} ${method?.toUpperCase()} ${url}`, {
      status,
      statusText,
      data,
      error: error.message
    });
  } else if (error.request) {
    // The request was made but no response was received
    log(LOG_LEVELS.ERROR, 'API Error: No response received', {
      url: error.config?.url,
      method: error.config?.method,
      error: error.message
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    log(LOG_LEVELS.ERROR, 'API Error: Request setup failed', {
      message: error.message,
      stack: error.stack
    });
  }
  
  return Promise.reject(error);
};

/**
 * Create an Axios interceptor for request logging
 * @returns {Object} Axios interceptor configuration
 */
export const createRequestLogger = () => ({
  request: [
    (config) => {
      logRequest(config);
      return config;
    },
    (error) => {
      logError(error);
      return Promise.reject(error);
    }
  ]
});

/**
 * Create an Axios interceptor for response logging
 * @returns {Object} Axios interceptor configuration
 */
export const createResponseLogger = () => ({
  response: [
    (response) => {
      logResponse(response);
      return response;
    },
    (error) => {
      logError(error);
      return Promise.reject(error);
    }
  ]
});

// Export log levels
export { LOG_LEVELS };

// Default export with all logging functions
export default {
  configureLogger,
  resetLogger,
  logRequest,
  logResponse,
  logError,
  createRequestLogger,
  createResponseLogger,
  LOG_LEVELS
};
