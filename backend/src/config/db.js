const mongoose = require('mongoose');
const config = require('./env');
const { logger } = require('./logger');

class Database {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return this.connection;
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      // Add authentication if credentials are in URI
      if (config.env === 'production') {
        options.retryWrites = true;
        options.w = 'majority';
      }

      this.connection = await mongoose.connect(config.database.uri, options);
      this.isConnected = true;

      logger.info(`MongoDB connected: ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
      return this.connection;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        // Remove all listeners for the 'disconnected' event to prevent the WARN log during a planned shutdown.
        mongoose.connection.removeAllListeners('disconnected');

        // Now, close the connection.
        await mongoose.connection.close();
        this.isConnected = false;
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Database not connected' };
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();

      return {
        status: 'healthy',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new Database();
