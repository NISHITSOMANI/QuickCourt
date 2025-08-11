const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Get notifications for a user with pagination
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
   * Create a new notification
   */
  async createNotification(notificationData) {
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
}

module.exports = new NotificationService();
