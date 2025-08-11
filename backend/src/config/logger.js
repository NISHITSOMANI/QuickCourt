const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('./env');

// Create base logger
const logger = pino({
  level: config.logging.level,
  transport: config.env === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.env,
    service: 'quickcourt-backend',
  },
});

// HTTP logger middleware
const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    // Generate unique request ID
    return req.headers['x-request-id'] || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (req.url === '/health' || req.url === '/metrics') {
      return undefined; // Skip logging for health/metrics endpoints
    }
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '[REDACTED]' : undefined,
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
    err: pino.stdSerializers.err,
  },
});

// Add request ID to all logs
const addRequestId = (req, res, next) => {
  req.log = req.log.child({ requestId: req.id });
  next();
};

// Error logger
const logError = (error, req = null) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  if (req) {
    logData.requestId = req.id;
    logData.url = req.url;
    logData.method = req.method;
  }

  logger.error(logData, 'Application error occurred');
};

// Performance logger
const logPerformance = (operation, duration, metadata = {}) => {
  logger.info({
    operation,
    duration,
    ...metadata,
  }, `Performance: ${operation} took ${duration}ms`);
};

// Security logger
const logSecurity = (event, req, details = {}) => {
  logger.warn({
    event,
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    ...details,
  }, `Security event: ${event}`);
};

// Business logic logger
const logBusiness = (event, userId, details = {}) => {
  logger.info({
    event,
    userId,
    ...details,
  }, `Business event: ${event}`);
};

module.exports = {
  logger,
  httpLogger,
  addRequestId,
  logError,
  logPerformance,
  logSecurity,
  logBusiness,
};
