const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const { logger, httpLogger } = require('./config/logger');
// Note: DB connect is handled in server.js
const routes = require('./routes');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Trust proxy for accurate client IP (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development environment - allow all localhost and 127.0.0.1 origins
    if (process.env.NODE_ENV === 'development') {
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-XSRF-TOKEN',
    'x-request-timestamp',
    'X-Request-Timestamp',
    'Cache-Control',
    'Pragma',
    'If-Modified-Since',
    'x-access-token',
    'x-refresh-token',
    'X-Request-ID',
    'X-HTTP-Method-Override',
    'Accept-Version',
    'Content-Length',
    'X-API-Version',
    'X-Response-Time',
    'X-Forwarded-For',
    'X-Forwarded-Proto',
    'X-Real-IP'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};


app.use(cors(corsOptions));

// Request logging middleware
app.use(httpLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Data sanitization middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Clean user input from malicious HTML
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health';
  },
});

app.use(globalLimiter);

// Ignore favicon requests (API only app)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Optional safe Swagger/OpenAPI documentation (development only)
const NODE_ENV = config.nodeEnv || process.env.NODE_ENV || 'development';
if (NODE_ENV === 'development') {
  try {
    let swaggerUi;
    try {
      swaggerUi = require('swagger-ui-express');
    } catch (e) {
      logger.info('swagger-ui-express not installed; skipping /api-docs mount.');
    }

    const openapiPath = path.join(__dirname, '..', 'openapi.json');
    if (swaggerUi && fs.existsSync(openapiPath)) {
      const swaggerDocument = require(openapiPath);
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'QuickCourt API Documentation',
      }));
      app.locals.swaggerMounted = true;
      logger.info('Swagger UI mounted at /api-docs');
    } else if (swaggerUi) {
      logger.info('openapi.json not found; skipping /api-docs mount.');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to mount Swagger UI; continuing without /api-docs');
  }
}

// API routes
app.use('/api/v1', routes);

// Metrics endpoint (for monitoring)
app.get('/metrics', (req, res) => {
  // In production, integrate with Prometheus or similar
  res.status(200).json({
    success: true,
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// NOTE: graceful shutdown should be implemented in server.js (not app.js)

module.exports = app;
