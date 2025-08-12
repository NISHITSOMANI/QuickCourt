import api from './config';
import { toast } from 'react-hot-toast';

/**
 * Notification API service for handling notifications
 */
export const notificationApi = {
  /**
   * Get user notifications
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Notifications list
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} - Success response
   */
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      toast.success('All notifications marked as read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Success response
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      toast.success('Notification deleted');
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
      throw error;
    }
  }
};

export default notificationApi;
