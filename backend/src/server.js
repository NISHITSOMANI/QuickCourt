const app = require('./app');
const config = require('./config/env');
const { logger } = require('./config/logger');
const db = require('./config/db');
const mongoose = require('mongoose');
const pino = require('pino');
const fs = require('fs');

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 30_000;
const STARTUP_DB_TIMEOUT_MS = Number(process.env.STARTUP_DB_TIMEOUT_MS) || 10_000;

let server;
let shuttingDown = false;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m',
};

// Small helper to synchronously write to stdout/stderr so Windows/Powershell shows messages immediately
function syncStdoutWrite(msg, color = '') {
  try {
    // Apply color if provided and reset at the end
    const formattedMsg = color ? `${color}${msg}${colors.reset}` : msg;
    // fd 1 -> stdout
    fs.writeSync(1, formattedMsg + '\n');
  } catch (e) {
    // best-effort fallback to console
    try { console.log(msg); } catch (_) { }
  }
}

// Middleware to return 503 while shutting down
app.use((req, res, next) => {
  if (shuttingDown) {
    res.set('Connection', 'close');
    return res.status(503).json({
      success: false,
      message: 'Server is restarting, please try again shortly',
    });
  }
  next();
});

// Promise wrappers with timeouts
function closeServer(serverInstance, timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;
    serverInstance.close((err) => {
      if (finished) return;
      finished = true;
      if (err) return reject(err);
      resolve();
    });
    setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('Server close timed out'));
    }, timeoutMs);
  });
}

function disconnectDatabase(timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;

    // Use the db instance disconnect method with timeout protection
    const disconnectPromise = db.disconnect();

    disconnectPromise
      .then(() => {
        if (finished) return;
        finished = true;
        resolve();
      })
      .catch((err) => {
        if (finished) return;
        finished = true;
        reject(err);
      });

    setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('Database disconnect timed out'));
    }, timeoutMs);
  })
    .catch(err => {
      throw err;
    });
}

// Start-up sequence
(async () => {
  try {
    const dbPromise = db.connect();
    const dbTimeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('DB connect timed out')), STARTUP_DB_TIMEOUT_MS)
    );
    await Promise.race([dbPromise, dbTimeout]);

    logger.info('Database connected');

    const PORT = config.port || 5000;
    server = app.listen(PORT, () => {
      logger.info(`QuickCourt API server running on port ${PORT} in ${config.nodeEnv || 'development'} mode`);
      logger.info(`Health check available at: http://localhost:${PORT}/api/v1/health`);
      if ((config.nodeEnv || 'development') === 'development') {
        logger.info(`API docs: http://localhost:${PORT}/api-docs`);
        logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      }
    });

    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;
      if (error.code === 'EACCES') {
        logger.error(`${bind} requires elevated privileges`);
        gracefulExit(1);
      } else if (error.code === 'EADDRINUSE') {
        logger.error(`${bind} is already in use`);
        gracefulExit(1);
      } else {
        throw error;
      }
    });
  } catch (err) {
    logger.error({ err }, 'Startup failed');
    try { finalLogger.error({ err }, 'Fatal startup error'); } catch (e) { }
    // Synchronous fallback so message is visible immediately
    syncStdoutWrite(`[FATAL] Startup failed: ${err.message || err}`);
    setTimeout(() => process.exit(1), 250);
  }
})();

// Central shutdown procedure (synchronous final writes only)
async function doShutdown(signal) {
  if (shuttingDown) {
    syncStdoutWrite('[SHUTDOWN] Shutdown already in progress, ignoring duplicate signal', colors.yellow);
    return;
  }
  shuttingDown = true;

  syncStdoutWrite('\n=== SHUTDOWN INITIATED ===', colors.bright);
  syncStdoutWrite(`Signal: ${signal}`, '');
  syncStdoutWrite('Shutting down services...\n', '');

  const COMPONENT_TIMEOUT = 10000; // 10 seconds for each component

  try {
    if (server) {
      syncStdoutWrite('[SHUTDOWN] Closing HTTP server...', colors.yellow);
      await closeServer(server, COMPONENT_TIMEOUT);
      syncStdoutWrite('[SHUTDOWN] HTTP server closed', colors.green);
    }

    syncStdoutWrite('[SHUTDOWN] Closing MongoDB connection...', colors.yellow);
    await disconnectDatabase(COMPONENT_TIMEOUT);
    syncStdoutWrite('[SHUTDOWN] MongoDB connection closed', colors.green);

    syncStdoutWrite('\n=== SHUTDOWN COMPLETE ===', colors.bright);
    syncStdoutWrite(`Time: ${new Date().toLocaleTimeString()}`, '');
    
    // Force immediate exit to prevent any lingering handles
    process.exit(0);
  } catch (err) {
    syncStdoutWrite(`[SHUTDOWN ERROR] ${err.message || err}`, colors.red);
    process.exit(1); // Exit with error code if shutdown fails
  }
}

function gracefulExit(code = 0) {
  doShutdown('gracefulExit').then(() => process.exit(code));
}

// Signal handlers
process.on('SIGTERM', () => doShutdown('SIGTERM'));
process.on('SIGINT', () => doShutdown('SIGINT'));

// uncaught & unhandled rejection handlers
process.on('uncaughtException', (err) => {
  syncStdoutWrite(`[FATAL] Uncaught Exception: ${err.message}`, colors.red);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  syncStdoutWrite(`[FATAL] Unhandled Rejection: ${reason}`, colors.red);
  console.error(promise);
  process.exit(1);
});

module.exports = server;
