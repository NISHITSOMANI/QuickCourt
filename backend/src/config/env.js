const Joi = require('joi');
require('dotenv').config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  HOST: Joi.string().default('localhost'),
  
  MONGODB_URI: Joi.string().required(),
  MONGODB_TEST_URI: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  CACHE_TTL_SECONDS: Joi.number().default(300),
  CACHE_MAX_SIZE: Joi.number().default(1000),
  
  UPLOAD_MAX_SIZE: Joi.number().default(5242880),
  UPLOAD_ALLOWED_TYPES: Joi.string().default('image/jpeg,image/png,image/gif,image/webp'),
  
  CIRCUIT_BREAKER_TIMEOUT: Joi.number().default(3000),
  CIRCUIT_BREAKER_ERROR_THRESHOLD: Joi.number().default(50),
  CIRCUIT_BREAKER_RESET_TIMEOUT: Joi.number().default(30000),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  LOCK_TTL_SECONDS: Joi.number().default(30),
  LOCK_RETRY_DELAY_MS: Joi.number().default(100),
  LOCK_MAX_RETRIES: Joi.number().default(10),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  
  database: {
    uri: envVars.NODE_ENV === 'test' ? envVars.MONGODB_TEST_URI : envVars.MONGODB_URI,
    testUri: envVars.MONGODB_TEST_URI,
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  
  email: {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    secure: envVars.EMAIL_SECURE,
    auth: {
      user: envVars.EMAIL_USER,
      pass: envVars.EMAIL_PASS,
    },
    from: envVars.EMAIL_FROM,
  },
  
  cors: {
    origins: envVars.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: envVars.RATE_LIMIT_SKIP_SUCCESS_REQUESTS,
  },
  
  cache: {
    ttlSeconds: envVars.CACHE_TTL_SECONDS,
    maxSize: envVars.CACHE_MAX_SIZE,
  },
  
  upload: {
    maxSize: envVars.UPLOAD_MAX_SIZE,
    allowedTypes: envVars.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()),
  },
  
  circuitBreaker: {
    timeout: envVars.CIRCUIT_BREAKER_TIMEOUT,
    errorThresholdPercentage: envVars.CIRCUIT_BREAKER_ERROR_THRESHOLD,
    resetTimeout: envVars.CIRCUIT_BREAKER_RESET_TIMEOUT,
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },
  
  lock: {
    ttlSeconds: envVars.LOCK_TTL_SECONDS,
    retryDelayMs: envVars.LOCK_RETRY_DELAY_MS,
    maxRetries: envVars.LOCK_MAX_RETRIES,
  },
  
  admin: {
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD,
  },
  
  booking: {
    advanceLimitDays: envVars.BOOKING_ADVANCE_LIMIT_DAYS || 30,
    cancellationHours: envVars.BOOKING_CANCELLATION_HOURS || 2,
  },
};
