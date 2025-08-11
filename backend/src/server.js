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

// pino final logger (if available)
const finalLogger = typeof pino.final === 'function' ? pino.final(logger) : logger;

// Small helper to synchronously write to stdout/stderr so Windows/Powershell shows messages immediately
function syncStdoutWrite(msg) {
  try {
    // fd 1 -> stdout
    fs.writeSync(1, msg + '\n');
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

function disconnectMongoose(timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;
    mongoose.connection.close(false, (err) => {
      if (finished) return;
      finished = true;
      if (err) return reject(err);
      resolve();
    });
    setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('Mongoose disconnect timed out'));
    }, timeoutMs);
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

// Central shutdown procedure (synchronous final writes included)
async function doShutdown(signal) {
  if (shuttingDown) {
    logger.warn('Shutdown already in progress, ignoring duplicate signal');
    return;
  }
  shuttingDown = true;

  const startMsg = `Received ${signal}. Starting graceful shutdown...`;
  logger.info(startMsg);
  syncStdoutWrite(startMsg);

  const hardTimeout = setTimeout(() => {
    const msg = 'Shutdown timed out, forcing exit';
    logger.error(msg);
    syncStdoutWrite(msg);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    if (server) {
      logger.info('Closing HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed');
        syncStdoutWrite('HTTP server closed');
      });

      // Immediately destroy any keep-alive sockets
      server.on('connection', (socket) => socket.destroy());
    }

    logger.info('Closing MongoDB connection...');
    await mongoose.connection.close(true);
    logger.info('MongoDB connection closed');

    clearTimeout(hardTimeout);
    syncStdoutWrite('Shutdown complete. Exiting now.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    syncStdoutWrite(`Error during shutdown: ${err.message}`);
    clearTimeout(hardTimeout);
    process.exit(1);
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
  try { finalLogger.fatal({ err }, 'uncaughtException - shutting down'); } catch (e) { console.error(e); }
  syncStdoutWrite(`uncaughtException: ${err && err.message ? err.message : String(err)}`);
  setTimeout(() => process.exit(1), 200);
});

process.on('unhandledRejection', (reason) => {
  try { finalLogger.error({ reason }, 'unhandledRejection - shutting down'); } catch (e) { console.error(e); }
  syncStdoutWrite(`unhandledRejection: ${reason && reason.message ? reason.message : String(reason)}`);
  setTimeout(() => process.exit(1), 200);
});

module.exports = server;
