import api from './config';
import { toast } from 'react-hot-toast';
import { transformUser, transformVenue, transformBooking } from '../utils/apiTransformers';

/**
 * Admin API service for admin-specific operations
 */
export const adminApi = {
  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Users list with pagination
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return {
        users: response.data.users?.map(transformUser) || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      throw error;
    }
  },

  /**
   * Update user status (activate/deactivate)
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} - Updated user
   */
  updateUserStatus: async (userId, isActive) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      return transformUser(response.data);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
      throw error;
    }
  },

  /**
   * Get system analytics
   * @param {Object} params - Query parameters (dateRange, etc.)
   * @returns {Promise<Object>} - Analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
      throw error;
    }
  },

  /**
   * Get all venues for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Venues list with pagination
   */
  getVenues: async (params = {}) => {
    try {
      const response = await api.get('/admin/venues', { params });
      return {
        venues: response.data.venues?.map(transformVenue) || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to fetch venues');
      throw error;
    }
  },

  /**
   * Update venue status
   * @param {string} venueId - Venue ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated venue
   */
  updateVenueStatus: async (venueId, status) => {
    try {
      const response = await api.patch(`/admin/venues/${venueId}/status`, { status });
      toast.success('Venue status updated successfully');
      return transformVenue(response.data);
    } catch (error) {
      console.error('Error updating venue status:', error);
      toast.error('Failed to update venue status');
      throw error;
    }
  },

  /**
   * Get system reports
   * @param {Object} params - Report parameters
   * @returns {Promise<Object>} - Report data
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/admin/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      throw error;
    }
  }
};

export default adminApi;
