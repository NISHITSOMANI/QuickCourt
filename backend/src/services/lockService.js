const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../config/logger').logger;

/**
 * MongoDB-based distributed lock service
 * TODO: Replace with Redis-based locks for better performance in production
 * 
 * Migration notes:
 * 1. Replace MongoDB operations with Redis SET NX EX commands
 * 2. Use Redis Lua scripts for atomic operations
 * 3. Consider Redis Redlock algorithm for multi-node setups
 */

// Lock schema for MongoDB
const lockSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: config.lock.ttlSeconds },
});

const Lock = mongoose.model('Lock', lockSchema);

class LockService {
  constructor() {
    this.locks = new Map(); // In-memory tracking for this instance
  }

  /**
   * Acquire a distributed lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner identifier
   * @param {number} ttlSeconds - Lock TTL in seconds
   * @returns {Promise<boolean>}
   */
  async acquire(key, owner, ttlSeconds = config.lock.ttlSeconds) {
    try {
      const lockDoc = new Lock({
        key,
        owner,
        createdAt: new Date(),
      });

      await lockDoc.save();
      
      // Track locally
      this.locks.set(key, { owner, acquiredAt: Date.now() });
      
      logger.debug(`Lock acquired: ${key} by ${owner}`);
      return true;
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        logger.debug(`Lock acquisition failed - already exists: ${key}`);
        return false;
      }
      logger.error('Lock acquisition error:', error);
      return false;
    }
  }

  /**
   * Release a distributed lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner identifier
   * @returns {Promise<boolean>}
   */
  async release(key, owner) {
    try {
      const result = await Lock.deleteOne({ key, owner });
      
      if (result.deletedCount > 0) {
        this.locks.delete(key);
        logger.debug(`Lock released: ${key} by ${owner}`);
        return true;
      }
      
      logger.debug(`Lock release failed - not found or wrong owner: ${key}`);
      return false;
    } catch (error) {
      logger.error('Lock release error:', error);
      return false;
    }
  }

  /**
   * Acquire lock with retry mechanism
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner identifier
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<boolean>}
   */
  async acquireWithRetry(key, owner, maxRetries = config.lock.maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      const acquired = await this.acquire(key, owner);
      if (acquired) return true;
      
      // Exponential backoff
      const delay = config.lock.retryDelayMs * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  }

  /**
   * Execute callback with lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner identifier
   * @param {Function} callback - Function to execute with lock
   * @returns {Promise<any>}
   */
  async withLock(key, owner, callback) {
    const acquired = await this.acquireWithRetry(key, owner);
    if (!acquired) {
      throw new Error(`Failed to acquire lock: ${key}`);
    }

    try {
      return await callback();
    } finally {
      await this.release(key, owner);
    }
  }

  /**
   * Check if lock exists
   * @param {string} key - Lock key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const lock = await Lock.findOne({ key });
      return !!lock;
    } catch (error) {
      logger.error('Lock exists check error:', error);
      return false;
    }
  }

  /**
   * Get lock information
   * @param {string} key - Lock key
   * @returns {Promise<Object|null>}
   */
  async getLock(key) {
    try {
      const lock = await Lock.findOne({ key });
      return lock ? {
        key: lock.key,
        owner: lock.owner,
        createdAt: lock.createdAt,
      } : null;
    } catch (error) {
      logger.error('Get lock error:', error);
      return null;
    }
  }
}

module.exports = new LockService();
