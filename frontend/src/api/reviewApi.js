import api from './config';
import { toast } from 'react-hot-toast';
import { transformReview, transformReviews } from '../utils/apiTransformers';

// Helper function to handle API errors consistently
const handleApiError = (error, context = '') => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error.response) {
    // Server responded with a non-2xx status
    const { status, data } = error.response;
    
    if (status === 401) {
      toast.error('Please log in to continue');
    } else if (status === 404) {
      toast.error('Resource not found');
    } else if (status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (data?.message) {
      toast.error(data.message);
    } else {
      toast.error('An error occurred. Please try again.');
    }
  } else if (error.request) {
    // No response received
    toast.error('Network error. Please check your connection.');
  } else {
    // Request setup error
    toast.error(error.message || 'An unexpected error occurred');
  }
  
  return Promise.reject(error);
};

/**
 * Review API service for handling all review-related operations with comprehensive error handling,
 * caching, and request management.
 * 
 * @module reviewApi
 */
const reviewApi = {
  /**
   * Get paginated reviews for a specific venue with caching support
   * @param {string} venueId - ID of the venue
   * @param {Object} [params={}] - Query parameters (page, limit, sort, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{reviews: Array, pagination: Object}>} - Transformed reviews and pagination info
   */
  async getVenueReviews(venueId, params = {}, useCache = true) {
    if (!venueId) {
      throw new Error('Venue ID is required');
    }

    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params
    };

    const cacheKey = `venue-${venueId}-reviews-${JSON.stringify(defaultParams)}`;

    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.getVenueReviews(venueId, defaultParams);
      return transformReviewList(mockData);
    }

    try {
      const response = await api.get(`/venues/${venueId}/reviews`, {
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache for reviews
          useCache: useCache
        }
      });

      return transformReviewList(response.data);
    } catch (error) {
      console.error(`Error fetching reviews for venue ${venueId}:`, error);

      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(cacheKey);
      if (cachedResponse) {
        toast('Using cached review data', { icon: '⚠️' });
        return transformReviewList(cachedResponse.data);
      }

      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Venue not found');
        } else {
          toast.error('Failed to load reviews. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }

      // Return empty results instead of throwing to prevent UI crashes
      return {
        reviews: [],
        pagination: {
          page: defaultParams.page,
          limit: defaultParams.limit,
          total: 0,
          pages: 0
        }
      };
    }
  },

  /**
   * Get a single review by ID with caching support
   * @param {string} reviewId - ID of the review to fetch
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<Object>} - Transformed review details
   */
  async getReview(reviewId, useCache = true) {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    const cacheKey = `review-${reviewId}`;

    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.getReview(reviewId);
      return transformReview(mockData);
    }

    try {
      const response = await api.get(`/reviews/${reviewId}`, {
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 10 * 60 * 1000, // 10 minutes cache for a single review
          useCache: useCache
        }
      });

      return transformReview(response.data);
    } catch (error) {
      console.error(`Error fetching review ${reviewId}:`, error);

      const cachedResponse = api.getCachedResponse(cacheKey);
      if (cachedResponse) {
        toast('Using cached review data', { icon: '⚠️' });
        return transformReview(cachedResponse.data);
      }

      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Review not found');
        } else {
          toast.error('Failed to load review. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }

      throw error; // Rethrow to be handled by the caller
    }
  },

  /**
   * Create a new review for a venue
   * @param {string} venueId - ID of the venue being reviewed
   * @param {Object} reviewData - Review content and rating
   * @param {string} reviewData.comment - Review text
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {Array<File>} [reviewData.photos] - Optional review photos
   * @returns {Promise<Object>} - Created review
   */
  async createReview(venueId, reviewData) {
    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.createReview(venueId, reviewData);
      return transformReview(mockData);
    }

    const formData = new FormData();
    formData.append('comment', reviewData.comment);
    formData.append('rating', reviewData.rating);
    if (reviewData.photos && reviewData.photos.length > 0) {
      reviewData.photos.forEach(photo => {
        formData.append('photos', photo);
      });
    }

    try {
      const response = await api.post(`/venues/${venueId}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Invalidate venue reviews cache after creating a new one
      api.invalidateCache(`venue-${venueId}-reviews`);
      toast.success('Review submitted successfully!');
      return transformReview(response.data);
    } catch (error) {
      return handleApiError(error, 'createReview');
    }
  },

  /**
   * Update an existing review
   * @param {string} reviewId - ID of the review to update
   * @param {Object} updates - Fields to update
   * @param {string} [updates.comment] - Updated review text
   * @param {number} [updates.rating] - Updated rating (1-5)
   * @param {Array<File>} [updates.photosToAdd] - New photos to add
   * @param {Array<string>} [updates.photoIdsToRemove] - Photo IDs to remove
   * @returns {Promise<Object>} - Updated review data
   */
  async updateReview(reviewId, updates) {
    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.updateReview(reviewId, updates);
      return transformReview(mockData);
    }

    const formData = new FormData();
    if (updates.comment) formData.append('comment', updates.comment);
    if (updates.rating) formData.append('rating', updates.rating);
    if (updates.photosToAdd && updates.photosToAdd.length > 0) {
      updates.photosToAdd.forEach(photo => {
        formData.append('photosToAdd', photo);
      });
    }
    if (updates.photoIdsToRemove && updates.photoIdsToRemove.length > 0) {
      formData.append('photoIdsToRemove', JSON.stringify(updates.photoIdsToRemove));
    }

    try {
      const response = await api.patch(`/reviews/${reviewId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Invalidate relevant caches after successful update
      api.invalidateCache(`review-${reviewId}`);
      const reviewData = api.getCachedResponse(`review-${reviewId}`);
      if (reviewData?.data?.venue) {
        api.invalidateCache(`venue-${reviewData.data.venue}-reviews`);
      }
      api.invalidateCache('user-reviews');
      api.invalidateCache('reviews-with-photos');
      api.invalidateCache('recent-reviews');
      api.invalidateCache('reviews-by-rating');

      toast.success('Review updated successfully!');
      return transformReview(response.data);
    } catch (error) {
      return handleApiError(error, 'updateReview');
    }
  },

  /**
   * Delete a review with comprehensive error handling and cache management
   * @param {string} reviewId - ID of the review to delete
   * @returns {Promise<Object>} - Deletion confirmation with deleted review data
   */
  async deleteReview(reviewId) {
    if (shouldUseMockApi()) {
      return await mockReviewApi.deleteReview(reviewId);
    }

    const toastId = toast.loading('Deleting review...');

    try {
      const response = await api.delete(`/reviews/${reviewId}`);

      // Invalidate relevant caches after successful deletion
      api.invalidateCache(`review-${reviewId}`);
      const reviewData = api.getCachedResponse(`review-${reviewId}`);
      if (reviewData?.data?.venue) {
        api.invalidateCache(`venue-${reviewData.data.venue}-reviews`);
      }
      api.invalidateCache('user-reviews');
      api.invalidateCache('reviews-with-photos');
      api.invalidateCache('recent-reviews');
      api.invalidateCache('reviews-by-rating');

      toast.success('Review deleted successfully!', { id: toastId });
      return response.data;
    } catch (error) {
      toast.dismiss(toastId);
      return handleApiError(error, 'deleteReview');
    }
  },

  /**
   * Toggle like on a review with optimistic updates and cache management
   * @param {string} reviewId - ID of the review to like/unlike
   * @returns {Promise<{liked: boolean, likeCount: number}>} - Updated like status and count
   */
  async toggleLike(reviewId) {
    if (shouldUseMockApi()) {
      return await mockReviewApi.toggleLike(reviewId);
    }

    try {
      const response = await api.post(`/reviews/${reviewId}/like`);

      // Invalidate relevant caches after successful like toggle
      api.invalidateCache(`review-${reviewId}`);
      api.invalidateCache('user-reviews');
      api.invalidateCache('reviews-with-photos');
      api.invalidateCache('recent-reviews');
      api.invalidateCache('reviews-by-rating');

      toast.success(response.data.liked ? 'Review liked!' : 'Review unliked!');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'toggleLike');
    }
  },

  /**
   * Get paginated reviews by a specific user with caching support
   * @param {string} userId - ID of the user
   * @param {Object} [params={}] - Query parameters (page, limit, sort, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{reviews: Array, pagination: Object}>} - User's reviews and pagination info
   */
  async getUserReviews(userId, params = {}, useCache = true) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params
    };

    const cacheKey = `user-reviews-${userId}-${JSON.stringify(defaultParams)}`;

    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.getUserReviews(userId, defaultParams);
      return transformReviewList(mockData);
    }

    try {
      const response = await api.get(`/users/${userId}/reviews`, {
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache for user reviews
          useCache: useCache
        }
      });

      return transformReviewList(response.data);
    } catch (error) {
      console.error(`Error fetching user reviews for ${userId}:`, error);

      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(cacheKey);
      if (cachedResponse) {
        toast('Using cached user reviews', { icon: '⚠️' });
        return transformReviewList(cachedResponse.data);
      }

      if (error.response) {
        if (error.response.status === 404) {
          toast.error('User not found');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to view these reviews');
        } else {
          toast.error('Failed to load user reviews. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }

      // Return empty results instead of throwing to prevent UI crashes
      return {
        reviews: [],
        pagination: {
          page: defaultParams.page,
          limit: defaultParams.limit,
          total: 0,
          pages: 0
        }
      };
    }
  },

  /**
   * Get reviews with photos, with caching support
   * @param {Object} [params={}] - Query parameters (limit, page, etc.)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{reviews: Array, pagination: Object}>} - Reviews with photos and pagination info
   */
  async getReviewsWithPhotos(params = {}, useCache = true) {
    const defaultParams = {
      limit: 10,
      page: 1,
      hasPhotos: true,
      sort: '-createdAt',
      ...params
    };

    const cacheKey = `reviews-with-photos-${JSON.stringify(defaultParams)}`;

    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.getReviewsWithPhotos(defaultParams);
      return transformReviewList(mockData);
    }

    try {
      const response = await api.get('/reviews', {
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 10 * 60 * 1000, // 10 minutes cache for reviews with photos
          useCache: useCache
        }
      });

      return transformReviewList(response.data);
    } catch (error) {
      return handleApiError(error, 'getReviewsWithPhotos');
    }
  },

  /**
   * Get reviews by rating with caching support
   * @param {number} rating - Rating to filter by (1-5)
   * @param {Object} [params={}] - Additional query parameters
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<{reviews: Array, pagination: Object}>} - Filtered reviews and pagination info
   */
  async getReviewsByRating(rating, params = {}, useCache = true) {
    const ratingNum = Number(rating);
    if (![1, 2, 3, 4, 5].includes(ratingNum)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params,
      rating: ratingNum
    };

    const cacheKey = `reviews-rating-${ratingNum}-${JSON.stringify(defaultParams)}`;

    if (shouldUseMockApi()) {
      const mockData = await mockReviewApi.getReviewsByRating(ratingNum, defaultParams);
      return transformReviewList(mockData);
    }

    try {
      const response = await api.get('/reviews', {
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 15 * 60 * 1000, // 15 minutes cache for reviews by rating
          useCache: useCache
        }
      });

      return transformReviewList(response.data);
    } catch (error) {
      return handleApiError(error, 'getReviewsByRating');
    }
  }
};

// Export the reviewApi object as both named and default exports
export { reviewApi };
export default reviewApi;
