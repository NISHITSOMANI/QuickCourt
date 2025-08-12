const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');
const ServiceCircuitBreaker = require('../utils/circuitBreaker');

class NotificationService {
  constructor() {
    // Initialize circuit breakers for critical operations
    this.notificationBreaker = new ServiceCircuitBreaker(
      'notification-service',
      this._createNotificationInternal.bind(this),
      { 
        timeout: 5000, // 5s timeout for notification operations
        errorThresholdPercentage: 30, // Trip circuit if 30% of requests fail
        resetTimeout: 30000, // 30 seconds before attempting to close the circuit
      }
    );
  }
  /**
   * Get notifications for a user with pagination
   * Note: This is a read operation, so we don't use circuit breaker here
   * to ensure users can always retrieve their notifications
   */
  async getNotifications(userId, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const unreadOnly = options.unread === 'true';
      
      const query = { user: userId };
      if (unreadOnly) {
        query.read = false;
      }
      
      const notifications = await Notification.find(query)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
        
      return notifications;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new notification with circuit breaker protection
   */
  async createNotification(notificationData) {
    try {
      return await this.notificationBreaker.execute(notificationData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Notification service is temporarily unavailable', { error });
      // In a real app, you might want to queue failed notifications for later retry
      return null; // Graceful degradation - return null instead of failing
    }
  }

  /**
   * Internal method to create notification (wrapped by circuit breaker)
   */
  async _createNotificationInternal(notificationData) {
    try {
      const { userId, role, title, message, meta } = notificationData;
      
      let recipients = [];
      
      // If userId is specified, send to that user
      if (userId) {
        recipients = [userId];
      } 
      // If role is specified, send to all users with that role
      else if (role) {
        const users = await User.find({ role }).select('_id');
        recipients = users.map(user => user._id);
      }
      
      // Create notifications for each recipient
      const notifications = await Promise.all(
        recipients.map(recipientId => 
          new Notification({
            user: recipientId,
            title,
            message,
            meta,
          }).save()
        )
      );
      
      logger.info('Notifications created', { count: notifications.length, role, userId });
      
      return notifications[0]; // Return first notification for response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark notification as read
   * Note: This is a non-critical operation, so we don't use circuit breaker
   * to ensure users can always mark notifications as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );
      
      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete notification
   * Note: This is a non-critical operation, so we don't use circuit breaker
   * to ensure users can always delete their notifications
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });
      
      if (!notification) {
        throw new AppError('Notification not found or not authorized to delete', 404);
      }
      
      logger.info('Notification deleted', { notificationId, userId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      circuitBreaker: this.notificationBreaker ? this.notificationBreaker.getStats() : 'not_initialized',
      degraded: !this.notificationBreaker || this.notificationBreaker.isOpen()
    };
  }
}

module.exports = new NotificationService();
