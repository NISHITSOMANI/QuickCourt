import api from './config';
import { toast } from 'react-hot-toast';
import { 
  transformBooking, 
  transformBookings 
} from '../utils/apiTransformers';

/**
 * Booking API service for handling all booking-related operations
 */
const bookingApi = {
  /**
   * Get user's bookings with optional filters and pagination
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} - Bookings and pagination info
   */
  getMyBookings: async (params = {}, useCache = true) => {
    const defaultParams = {
      page: 1,
      limit: 10,
      sort: '-createdAt',
      ...params
    };
    
    const cacheKey = `my-bookings-${JSON.stringify(defaultParams)}`;
    
    try {
      const response = await api.get('/bookings', { 
        params: defaultParams,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 2 * 60 * 1000, // 2 minutes cache for bookings list
          useCache: useCache,
          // Don't cache if there are filters applied (except pagination)
          shouldCache: (config) => {
            const hasFilters = Object.keys(config.params || {}).some(
              key => !['page', 'limit', 'sort'].includes(key)
            );
            return !hasFilters;
          }
        }
      });
      
      return transformBookingList(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(`GET:/bookings?${new URLSearchParams(defaultParams).toString()}`);
      if (cachedResponse) {
        toast('Using cached booking data', { icon: '⚠️' });
        return transformBookingList(cachedResponse.data);
      }
      
      // No cache available, return empty results
      console.warn('No cached booking data available');
      return {
        bookings: [],
        pagination: {
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10,
          totalPages: 0
        }
      };
    }
  },

  /**
   * Get booking details by ID
   * @param {string} bookingId - Booking ID
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<Object>} - Transformed booking details
   */
  getBookingById: async (bookingId, useCache = true) => {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }
    
    const cacheKey = `booking-${bookingId}`;
    
    try {
      const response = await api.get(`/bookings/${bookingId}`, {
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache for individual bookings
          useCache: useCache
        }
      });
      
      return transformBooking(response.data);
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      
      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(`GET:/bookings/${bookingId}`);
      if (cachedResponse) {
        toast('Using cached booking data', { icon: '⚠️' });
        return transformBooking(cachedResponse.data);
      }
      
      // For 404 errors, return null instead of throwing
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking details
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.invalidateCache=true] - Whether to invalidate cache after creation
   * @returns {Promise<Object>} - Created booking
   */
  createBooking: async (bookingData, { invalidateCache = true } = {}) => {
    if (!bookingData) {
      throw new Error('Booking data is required');
    }
    
    try {
      const response = await api.post('/bookings', bookingData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate relevant caches after successful booking
        onSuccess: () => {
          if (invalidateCache) {
            // Invalidate the user's bookings list
            const cacheKeys = api.getCacheKeys();
            const userBookingKeys = cacheKeys.filter(key => key.startsWith('my-bookings'));
            userBookingKeys.forEach(key => api.invalidateCache(key));
            
            // Invalidate the court's availability cache
            if (bookingData.courtId) {
              const courtKeys = cacheKeys.filter(key => key.includes(`court-${bookingData.courtId}`));
              courtKeys.forEach(key => api.invalidateCache(key));
            }
            
            // Invalidate venue cache if needed
            if (bookingData.venueId) {
              api.invalidateCache(`venue-${bookingData.venueId}`);
            }
          }
        }
      });
      
      toast.success('Booking created successfully');
      return transformBooking(response.data);
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid booking data. Please check your input.');
        } else if (error.response.status === 401) {
          toast.error('Please log in to make a booking');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to create this booking');
        } else if (error.response.status === 409) {
          toast.error('The selected time slot is no longer available');
        } else {
          toast.error('Failed to create booking. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID to cancel
   * @param {Object} [options] - Additional options
   * @param {string} [options.reason] - Reason for cancellation
   * @param {boolean} [options.invalidateCache=true] - Whether to invalidate cache after cancellation
   * @returns {Promise<Object>} - Cancellation confirmation
   */
  cancelBooking: async (bookingId, { reason, invalidateCache = true } = {}) => {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }
    
    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate relevant caches after successful cancellation
        onSuccess: () => {
          if (invalidateCache) {
            // Invalidate the specific booking cache
            api.invalidateCache(`booking-${bookingId}`);
            
            // Invalidate the user's bookings list
            const cacheKeys = api.getCacheKeys();
            const userBookingKeys = cacheKeys.filter(key => key.startsWith('my-bookings'));
            userBookingKeys.forEach(key => api.invalidateCache(key));
            
            // Get the booking details to invalidate related caches
            const booking = api.getCachedResponse(`GET:/bookings/${bookingId}`);
            if (booking && booking.data) {
              // Invalidate court and venue caches
              if (booking.data.courtId) {
                const courtKeys = cacheKeys.filter(key => key.includes(`court-${booking.data.courtId}`));
                courtKeys.forEach(key => api.invalidateCache(key));
              }
              
              if (booking.data.venueId) {
                api.invalidateCache(`venue-${booking.data.venueId}`);
              }
            }
          }
        }
      });
      
      toast.success('Booking cancelled successfully');
      return transformBooking(response.data);
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Cannot cancel this booking. It may be too close to the start time.');
        } else if (error.response.status === 401) {
          toast.error('Please log in to cancel this booking');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to cancel this booking');
        } else if (error.response.status === 404) {
          toast.error('Booking not found');
        } else if (error.response.status === 409) {
          toast.error('This booking cannot be cancelled');
        } else {
          toast.error('Failed to cancel booking. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Process payment for a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentData - Payment details
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.invalidateCache=true] - Whether to invalidate cache after payment
   * @returns {Promise<Object>} - Payment confirmation
   */
  processPayment: async (bookingId, paymentData, { invalidateCache = true } = {}) => {
    if (!bookingId || !paymentData) {
      throw new Error('Booking ID and payment data are required');
    }
    
    try {
      const response = await api.post(`/bookings/${bookingId}/pay`, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate relevant caches after successful payment
        onSuccess: () => {
          if (invalidateCache) {
            // Invalidate the booking cache
            api.invalidateCache(`booking-${bookingId}`);
            
            // Invalidate the user's bookings list
            const cacheKeys = api.getCacheKeys();
            const userBookingKeys = cacheKeys.filter(key => key.startsWith('my-bookings'));
            userBookingKeys.forEach(key => api.invalidateCache(key));
            
            // Get the booking details to invalidate related caches
            const booking = api.getCachedResponse(`GET:/bookings/${bookingId}`);
            if (booking && booking.data) {
              // Invalidate venue cache
              if (booking.data.venueId) {
                api.invalidateCache(`venue-${booking.data.venueId}`);
              }
            }
          }
        }
      });
      
      toast.success('Payment processed successfully');
      return transformPayment(response.data);
    } catch (error) {
      console.error(`Error processing payment for booking ${bookingId}:`, error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid payment data. Please check your input.');
        } else if (error.response.status === 401) {
          toast.error('Please log in to process payment');
        } else if (error.response.status === 402) {
          toast.error('Payment failed. Please check your payment details and try again.');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to process this payment');
        } else if (error.response.status === 404) {
          toast.error('Booking not found');
        } else if (error.response.status === 409) {
          toast.error('This booking has already been paid for');
        } else {
          toast.error('Failed to process payment. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Get booking availability for a court
   * @param {string} courtId - Court ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} [duration] - Duration in hours (optional)
   * @param {boolean} [useCache=true] - Whether to use cached response if available
   * @returns {Promise<Object>} - Availability information
   */
  getCourtAvailability: async (courtId, date, duration, useCache = true) => {
    if (!courtId || !date) {
      throw new Error('Court ID and date are required');
    }
    
    const params = { date };
    if (duration) params.duration = duration;
    
    const cacheKey = `court-${courtId}-availability-${date}${duration ? `-${duration}` : ''}`;
    
    try {
      const response = await api.get(`/courts/${courtId}/availability`, { 
        params,
        cacheKey: useCache ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache for availability
          useCache: useCache,
          // Don't cache too far in the future
          shouldCache: () => {
            const today = new Date();
            const targetDate = new Date(date);
            // Only cache if the date is within the next 7 days
            return (targetDate - today) / (1000 * 60 * 60 * 24) <= 7;
          }
        }
      });
      
      return {
        ...response.data,
        slots: response.data.slots.map(slot => transformTimeSlot(slot, courtId))
      };
    } catch (error) {
      console.error(`Error fetching availability for court ${courtId}:`, error);
      
      // If we have a cached response, return it with a warning
      const cachedResponse = api.getCachedResponse(`GET:/courts/${courtId}/availability?${new URLSearchParams(params).toString()}`);
      if (cachedResponse) {
        toast('Using cached availability data', { icon: '⚠️' });
        return {
          ...cachedResponse.data,
          slots: cachedResponse.data.slots.map(slot => transformTimeSlot(slot, courtId))
        };
      }
      
      // No cache available, return empty availability
      console.warn('No cached court availability data');
      return {
        courtId,
        date,
        duration: duration || 60,
        slots: [],
        isAvailable: false,
        message: 'No availability data available'
      };
    }
  },

  /**
   * Reschedule a booking
   * @param {string} bookingId - Booking ID to reschedule
   * @param {Object} rescheduleData - New booking details
   * @returns {Promise<Object>} - Updated booking
   */
  rescheduleBooking: async (bookingId, rescheduleData) => {
    if (!bookingId || !rescheduleData) {
      throw new Error('Booking ID and reschedule data are required')
    }

    try {
      const response = await api.patch(`/bookings/${bookingId}/reschedule`, rescheduleData)
      toast.success('Booking rescheduled successfully')
      return response.data
    } catch (error) {
      console.error(`Error rescheduling booking ${bookingId}:`, error)
      toast.error(error.response?.data?.message || 'Failed to reschedule booking')
      throw error
    }
  },

  // Confirm booking (owner/system)
  confirmBooking: (id) => {
    return api.post(`/bookings/${id}/confirm`)
  },

  // Get venue bookings (owner only)
  getVenueBookings: (venueId, params = {}) => {
    return api.get(`/bookings/venue/${venueId}`, { params })
  },

  // Get all bookings (admin only)
  getAllBookings: (params = {}) => {
    return api.get('/bookings/all', { params })
  },

  // Update booking status (owner/admin)
  updateBookingStatus: (id, status) => {
    return api.put(`/bookings/${id}/status`, { status })
  },

  // Get court availability
  getCourtAvailability: (courtId, date) => {
    return api.get(`/courts/${courtId}/availability`, { params: { date } })
  },

  // Get time slots for venue
  getVenueTimeSlots: (venueId, date) => {
    return api.get(`/timeslots/venue/${venueId}`, { params: { date } })
  },

  // Block court time (owner only)
  blockCourtTime: (courtId, blockData) => {
    return api.post(`/courts/${courtId}/block`, blockData)
  },

  // Unblock court time (owner only)
  unblockCourtTime: (courtId, blockId) => {
    return api.post(`/courts/${courtId}/unblock`, { blockId })
  },

  // Process payment for booking
  processPayment: (bookingId, paymentData) => {
    return api.post(`/bookings/${bookingId}/payment`, paymentData)
  },
};

// Named exports for direct usage in components
export const createBooking = bookingApi.createBooking.bind(bookingApi);

export { bookingApi };
