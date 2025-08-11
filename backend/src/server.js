const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');

// Connect to MongoDB
connectDB();

// Start server
const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
  logger.info(`QuickCourt API server running on port ${PORT} in ${config.nodeEnv} mode`);
  logger.info(`Health check available at: http://localhost:${PORT}/api/v1/health`);
  
  if (config.nodeEnv === 'development') {
    logger.info(`API documentation available at: http://localhost:${PORT}/api-docs`);
    logger.info(`Metrics available at: http://localhost:${PORT}/metrics`);
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
