import api from '../api';

/**
 * Get owner earnings data
 * @param {Object} params - Query parameters
 * @param {string} [params.timeRange='month'] - Time range for earnings data (week, month, year)
 * @param {number} [params.year] - Year for filtering data
 * @returns {Promise<Object>} - Earnings data including monthly breakdown and totals
 */
export const getOwnerEarnings = async (params = {}) => {
  try {
    const response = await api.get('/api/owner/earnings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner earnings:', error);
    throw error;
  }
};

/**
 * Get owner's bookings
 * @param {Object} params - Query parameters
 * @param {number} [params.limit=10] - Number of bookings to return
 * @param {string} [params.status] - Booking status filter
 * @param {string} [params.sort='-createdAt'] - Sort order
 * @returns {Promise<Object>} - List of bookings with pagination info
 */
export const getOwnerBookings = async (params = {}) => {
  try {
    const response = await api.get('/api/owner/bookings', { 
      params: {
        limit: 10,
        sort: '-createdAt',
        ...params
      } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    throw error;
  }
};

/**
 * Update owner profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - Updated profile
 */
export const updateOwnerProfile = async (profileData) => {
  try {
    const response = await api.put('/api/owner/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating owner profile:', error);
    throw error;
  }
};

/**
 * Change owner password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} - Success message
 */
export const changeOwnerPassword = async (passwordData) => {
  try {
    const response = await api.post('/api/owner/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Get owner's venues
 * @returns {Promise<Array>} - List of venues owned by the user
 */
export const getOwnerVenues = async () => {
  try {
    const response = await api.get('/api/owner/venues');
    return response.data;
  } catch (error) {
    console.error('Error fetching owner venues:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} - Updated preferences
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.put('/api/owner/notifications', preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};
