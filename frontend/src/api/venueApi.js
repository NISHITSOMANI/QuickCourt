import api from './config';
import { toast } from 'react-hot-toast';
import { transformVenue, transformVenues, transformReviews } from '../utils/apiTransformers';

/**
 * Venue API service for interacting with venue-related endpoints
 */
const venueApi = {
  /**
   * Get all venues with optional filters and pagination
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} - Response containing venues and pagination info
   */
  /**
   * Get all venues with optional filters and pagination
   * @param {Object} params - Query parameters for filtering and pagination
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{venues: Array, pagination: Object}>} - Transformed venues and pagination info
   */
  getVenues: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 12,
      sort: '-rating',
      ...params
    };
    
    try {
      const response = await api.get('/venues', { 
        params: defaultParams
      });
      
      // Use the imported transformVenues function
      return transformVenues(response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      
      // Return empty results on error
      return {
        venues: [],
        pagination: {
          total: 0,
          page: params.page || 1,
          limit: params.limit || 12,
          totalPages: 0
        }
      };
    }
  },

  /**
   * Get popular venues based on bookings and ratings
   * @param {number} limit - Maximum number of venues to return
   * @returns {Promise<Object>} - Response containing popular venues
   */
  getPopularVenues: async (limit = 10) => {
    try {
      const response = await api.get('/venues/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular venues:', error);
      toast.error('Failed to load popular venues. Please try again later.');
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Get venue details by ID
   * @param {string} id - Venue ID
   * @returns {Promise<Object>} - Venue details
   */
  /**
   * Get venue details by ID
   * @param {string} id - Venue ID
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<Object>} - Transformed venue details
   */
  getVenueById: async (id) => {
    if (!id) {
      throw new Error('Venue ID is required');
    }
    
    try {
      const response = await api.get(`/venues/${id}`);
      return transformVenue(response.data);
    } catch (error) {
      console.error(`Error fetching venue ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get courts for a specific venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Array>} - List of courts
   */
  getVenueCourts: async (venueId) => {
    if (!venueId) {
      throw new Error('Venue ID is required')
    }

    try {
      const response = await api.get(`/venues/${venueId}/courts`)
      return response.data.courts || []
    } catch (error) {
      console.error(`Error fetching courts for venue ${venueId}:`, error)
      toast.error('Failed to load court information.')
      return []
    }
  },

  /**
   * Get availability for a specific court
   * @param {string} courtId - Court ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} - Availability information
   */
  getCourtAvailability: async (courtId, date) => {
    if (!courtId || !date) {
      throw new Error('Court ID and date are required')
    }

    try {
      const response = await api.get(`/courts/${courtId}/availability`, { 
        params: { date } 
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching availability for court ${courtId}:`, error)
      throw error
    }
  },

  /**
   * Get reviews for a specific venue
   * @param {string} venueId - Venue ID
   * @param {Object} params - Query parameters (page, limit, sort)
   * @returns {Promise<Object>} - Reviews and pagination info
   */
  /**
   * Get reviews for a specific venue
   * @param {string} venueId - Venue ID
   * @param {Object} params - Query parameters (page, limit, sort)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{reviews: Array, pagination: Object}>} - Transformed reviews and pagination info
   */
  getVenueReviews: async (venueId, params = {}) => {
    if (!venueId) {
      throw new Error('Venue ID is required');
    }
    
    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params
    };
    
    try {
      const response = await api.get(`/venues/${venueId}/reviews`, {
        params: defaultParams
      });
      
      return {
        reviews: transformReviews(response.data.reviews || []),
        pagination: response.data.pagination || {
          total: 0,
          page: defaultParams.page,
          limit: defaultParams.limit,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error(`Error fetching reviews for venue ${venueId}:`, error);
      
      // Return empty results on error
      return {
        reviews: [],
        pagination: {
          total: 0,
          page: defaultParams.page,
          limit: defaultParams.limit,
          totalPages: 0
        }
      };
    }
  },

  /**
   * Submit a review for a venue
   * @param {string} venueId - Venue ID
   * @param {Object} reviewData - Review data (rating, comment, etc.)
   * @returns {Promise<Object>} - Created review
   */
  /**
   * Submit a review for a venue
   * @param {string} venueId - Venue ID
   * @param {Object} reviewData - Review data (rating, comment, etc.)
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.invalidateCache=true] - Whether to invalidate cache after submission
   * @returns {Promise<Object>} - Created review
   */
  submitVenueReview: async (venueId, reviewData, { invalidateCache = true } = {}) => {
    if (!venueId || !reviewData) {
      throw new Error('Venue ID and review data are required');
    }
    
    try {
      const response = await api.post(`/venues/${venueId}/reviews`, reviewData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate cache for this venue's reviews after successful submission
        onSuccess: () => {
          if (invalidateCache) {
            // Invalidate cache for all review pages of this venue
            const cacheKeys = api.getCacheKeys();
            const reviewCacheKeys = cacheKeys.filter(key => key.startsWith(`venue-${venueId}-reviews`));
            reviewCacheKeys.forEach(key => api.invalidateCache(key));
            
            // Also invalidate the venue cache to update the rating
            api.invalidateCache(`venue-${venueId}`);
          }
        }
      });
      
      toast.success('Review submitted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error submitting review for venue ${venueId}:`, error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please log in to submit a review');
        } else if (error.response.status === 400) {
          toast.error('Invalid review data. Please check your input.');
        } else if (error.response.status === 409) {
          toast.error('You have already reviewed this venue');
        } else {
          toast.error('Failed to submit review. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Create a new venue (owner only)
   * @param {Object} venueData - Venue data to create
   * @returns {Promise<Object>} - Created venue
   */
  createVenue: async (venueData) => {
    if (!venueData) {
      throw new Error('Venue data is required')
    }

    try {
      const response = await api.post('/venues', venueData)
      toast.success('Venue created successfully')
      return response.data
    } catch (error) {
      console.error('Error creating venue:', error)
      toast.error(error.response?.data?.message || 'Failed to create venue')
      throw error
    }
  },

  /**
   * Update an existing venue (owner/admin only)
   * @param {string} id - Venue ID
   * @param {Object} venueData - Updated venue data
   * @returns {Promise<Object>} - Updated venue
   */
  updateVenue: async (id, venueData) => {
    if (!id || !venueData) {
      throw new Error('Venue ID and data are required')
    }

    try {
      const response = await api.put(`/venues/${id}`, venueData)
      toast.success('Venue updated successfully')
      return response.data
    } catch (error) {
      console.error(`Error updating venue ${id}:`, error)
      toast.error(error.response?.data?.message || 'Failed to update venue')
      throw error
    }
  },

  /**
   * Delete a venue (owner/admin only)
   * @param {string} id - Venue ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteVenue: async (id) => {
    if (!id) {
      throw new Error('Venue ID is required')
    }

    try {
      const response = await api.delete(`/venues/${id}`)
      toast.success('Venue deleted successfully')
      return response.data
    } catch (error) {
      console.error(`Error deleting venue ${id}:`, error)
      toast.error(error.response?.data?.message || 'Failed to delete venue')
      throw error
    }
  },

  /**
   * Upload photos for a venue (owner only)
   * @param {string} venueId - Venue ID
   * @param {Array<File>} photos - Array of photo files
   * @returns {Promise<Object>} - Upload confirmation
   */
  uploadVenuePhotos: async (venueId, photos) => {
    if (!venueId || !photos?.length) {
      throw new Error('Venue ID and photos are required')
    }

    const formData = new FormData()
    photos.forEach((photo) => {
      formData.append('photos', photo)
    })

    try {
      const response = await api.post(`/venues/${venueId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Photos uploaded successfully')
      return response.data
    } catch (error) {
      console.error(`Error uploading photos for venue ${venueId}:`, error)
      toast.error('Failed to upload photos')
      throw error
    }
  },

  /**
   * Delete a venue photo (owner/admin only)
   * @param {string} venueId - Venue ID
   * @param {string} photoId - Photo ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteVenuePhoto: async (venueId, photoId) => {
    if (!venueId || !photoId) {
      throw new Error('Venue ID and Photo ID are required')
    }

    try {
      const response = await api.delete(`/venues/${venueId}/photos/${photoId}`)
      toast.success('Photo deleted successfully')
      return response.data
    } catch (error) {
      console.error(`Error deleting photo ${photoId} for venue ${venueId}:`, error)
      toast.error('Failed to delete photo')
      throw error
    }
  },

  /**
   * Create a new court for a venue (owner only)
   * @param {string} venueId - Venue ID
   * @param {Object} courtData - Court data to create
   * @returns {Promise<Object>} - Created court
   */
  createCourt: async (venueId, courtData) => {
    if (!venueId || !courtData) {
      throw new Error('Venue ID and court data are required')
    }

    try {
      const response = await api.post(`/venues/${venueId}/courts`, courtData)
      toast.success('Court added successfully')
      return response.data
    } catch (error) {
      console.error(`Error creating court for venue ${venueId}:`, error)
      toast.error('Failed to add court')
      throw error
    }
  },

  /**
   * Delete a court (owner/admin only)
   * @param {string} courtId - Court ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteCourt: async (courtId) => {
    if (!courtId) {
      throw new Error('Court ID is required')
    }

    try {
      const response = await api.delete(`/courts/${courtId}`)
      toast.success('Court deleted successfully')
      return response.data
    } catch (error) {
      console.error(`Error deleting court ${courtId}:`, error)
      toast.error('Failed to delete court')
      throw error
    }
  },

  /**
   * Update venue status (admin only)
   * @param {string} venueId - Venue ID
   * @param {string} status - New status (e.g., 'active', 'inactive', 'pending')
   * @returns {Promise<Object>} - Updated venue
   */
  updateVenueStatus: async (venueId, status) => {
    if (!venueId || !status) {
      throw new Error('Venue ID and status are required')
    }

    try {
      const response = await api.patch(`/admin/venues/${venueId}/status`, { status })
      toast.success('Venue status updated successfully')
      return response.data
    } catch (error) {
      console.error(`Error updating status for venue ${venueId}:`, error)
      toast.error('Failed to update venue status')
      throw error
    }
  }
};

// Named exports for direct usage in components
export const getVenues = venueApi.getVenues.bind(venueApi);
export const getVenueCourts = venueApi.getVenueCourts.bind(venueApi);

export { venueApi };
