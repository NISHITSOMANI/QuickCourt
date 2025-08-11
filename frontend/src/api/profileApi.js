import api from './config';
import { toast } from 'react-hot-toast';
import { transformUser, transformBookings } from '../utils/apiTransformers';

/**
 * Profile API module with comprehensive error handling and documentation.
 *
 * @module profileApi
 */

export const profileApi = {
  /**
   * Retrieves the current user's profile information.
   *
   * @async
   * @function getProfile
   * @param {boolean} [forceRefresh=false] - Whether to force a fresh fetch
   * @returns {Promise<Object>} A promise resolving to the transformed user profile data.
   */
  getProfile: async (forceRefresh = false) => {
    const cacheKey = 'user-profile';
    
    try {
      const response = await api.get('/profile', {
        cacheKey: !forceRefresh ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache
          useCache: !forceRefresh
        },
        // Don't retry on 401 (unauthorized)
        retry: {
          retryIf: (error) => !error.response || error.response.status !== 401
        }
      });
      
      return transformUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // If we have a cached response and it's not a 401, return it with a warning
      if (error.response?.status !== 401) {
        const cachedResponse = api.getCachedResponse('GET:/profile');
        if (cachedResponse) {
          toast('Using cached profile data', { icon: '⚠️' });
          return transformUser(cachedResponse.data);
        }
      }
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please log in to view your profile');
        } else if (error.response.status === 404) {
          toast.error('Profile not found');
        } else {
          toast.error('Failed to load profile. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Updates the current user's profile information.
   *
   * @async
   * @function updateProfile
   * @param {Object} profileData - The updated profile data.
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.invalidateCache=true] - Whether to invalidate cache after update
   * @returns {Promise<Object>} A promise resolving to the updated user's profile data.
   */
  updateProfile: async (profileData, { invalidateCache = true } = {}) => {
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Valid profile data is required');
    }
    
    try {
      const response = await api.put('/profile', profileData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate relevant caches after successful update
        onSuccess: () => {
          if (invalidateCache) {
            api.invalidateCache('user-profile');
            api.invalidateCache('current-user');
            // Invalidate any cached user data that might be affected
            const cacheKeys = api.getCacheKeys();
            cacheKeys
              .filter(key => key.includes('user-') || key.includes('profile-'))
              .forEach(key => api.invalidateCache(key));
          }
        }
      });
      
      toast.success('Profile updated successfully');
      return transformUser(response.data);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid profile data. Please check your input.');
        } else if (error.response.status === 401) {
          toast.error('Please log in to update your profile');
        } else if (error.response.status === 409) {
          toast.error('This email is already in use');
        } else {
          toast.error('Failed to update profile. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Get user's booking history with pagination and filtering
   * 
   * @async
   * @function getUserBookings
   * @param {Object} [params={}] - Query parameters (page, limit, status, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{bookings: Array, pagination: Object}>} - Transformed bookings and pagination info
   */
  getUserBookings: async (params = {}, useCache = true) => {
    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params
    };
    
    const cacheKey = `user-bookings-${JSON.stringify(defaultParams)}`;
    
    try {
      const response = await api.get('/profile/bookings', { 
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 2 * 60 * 1000, // 2 minutes cache for bookings list
          useCache: useCache
        }
      });
      
      return transformBookings(response.data);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      
      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(`GET:/profile/bookings?${new URLSearchParams(defaultParams).toString()}`);
      if (cachedResponse) {
        toast('Using cached booking data', { icon: '⚠️' });
        return transformBookings(cachedResponse.data);
      }
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please log in to view your bookings');
        } else {
          toast.error('Failed to load bookings. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Get owner's earnings with date range filtering (owner only)
   * 
   * @async
   * @function getOwnerEarnings
   * @param {Object} [params={}] - Query parameters (startDate, endDate, groupBy, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{earnings: Array, total: number}>} - Earnings data and total amount
   */
  getOwnerEarnings: async (params = {}, useCache = true) => {
    const cacheKey = `owner-earnings-${JSON.stringify(params)}`;
    
    try {
      const response = await api.get('/profile/earnings', {
        params,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 15 * 60 * 1000, // 15 minutes cache for earnings data
          useCache: useCache
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching owner earnings:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please log in to view earnings');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to view earnings');
        } else {
          toast.error('Failed to load earnings data. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Get owner's statistics (owner only)
   * 
   * @async
   * @function getOwnerStats
   * @param {Object} [params={}] - Query parameters (startDate, endDate, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<Object>} - Owner statistics
   */
  getOwnerStats: async (params = {}, useCache = true) => {
    const cacheKey = `owner-stats-${JSON.stringify(params)}`;
    
    try {
      const response = await api.get('/profile/stats', {
        params,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 15 * 60 * 1000, // 15 minutes cache for stats
          useCache: useCache
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching owner stats:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please log in to view statistics');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to view statistics');
        } else {
          toast.error('Failed to load statistics. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Upload a new profile avatar
   * 
   * @async
   * @function uploadAvatar
   * @param {File} file - The image file to upload
   * @returns {Promise<{avatarUrl: string}>} - The URL of the uploaded avatar
   */
  uploadAvatar: async (file) => {
    if (!file || !(file instanceof File)) {
      throw new Error('A valid file is required');
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Invalidate profile cache after successful upload
        onSuccess: () => {
          api.invalidateCache('user-profile');
          api.invalidateCache('current-user');
        }
      });
      
      toast.success('Profile picture updated');
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF)');
        } else if (error.response.status === 401) {
          toast.error('Please log in to update your profile picture');
        } else if (error.response.status === 413) {
          toast.error('File is too large. Maximum size is 5MB');
        } else {
          toast.error('Failed to upload profile picture. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }
};
