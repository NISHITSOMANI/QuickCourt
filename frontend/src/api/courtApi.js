import api from './config';
import { toast } from 'react-hot-toast';

/**
 * Court API service for handling court-related operations
 */
export const courtApi = {
  /**
   * Get courts for a venue
   * @param {string} venueId - Venue ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Courts list
   */
  getCourtsByVenue: async (venueId, params = {}) => {
    try {
      const response = await api.get(`/courts/venue/${venueId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error('Failed to fetch courts');
      throw error;
    }
  },

  /**
   * Get court availability
   * @param {string} courtId - Court ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} - Availability data
   */
  getCourtAvailability: async (courtId, date) => {
    try {
      const response = await api.get(`/courts/${courtId}/availability`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching court availability:', error);
      toast.error('Failed to fetch availability');
      throw error;
    }
  },

  /**
   * Create new court (owner/admin only)
   * @param {Object} courtData - Court details
   * @returns {Promise<Object>} - Created court
   */
  createCourt: async (courtData) => {
    try {
      const response = await api.post('/courts', courtData);
      toast.success('Court created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating court:', error);
      toast.error('Failed to create court');
      throw error;
    }
  },

  /**
   * Update court details (owner/admin only)
   * @param {string} courtId - Court ID
   * @param {Object} courtData - Updated court details
   * @returns {Promise<Object>} - Updated court
   */
  updateCourt: async (courtId, courtData) => {
    try {
      const response = await api.put(`/courts/${courtId}`, courtData);
      toast.success('Court updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating court:', error);
      toast.error('Failed to update court');
      throw error;
    }
  },

  /**
   * Delete court (owner/admin only)
   * @param {string} courtId - Court ID
   * @returns {Promise<Object>} - Success response
   */
  deleteCourt: async (courtId) => {
    try {
      const response = await api.delete(`/courts/${courtId}`);
      toast.success('Court deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error('Failed to delete court');
      throw error;
    }
  }
};

export default courtApi;
