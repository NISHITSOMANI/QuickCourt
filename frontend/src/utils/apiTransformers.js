/**
 * API Response Transformers
 * 
 * This file contains utility functions to transform API responses into
 * consistent data structures for use throughout the application.
 * 
 * Transformers ensure that:
 * 1. Data is consistently structured
 * 2. Default values are provided
 * 3. Data types are normalized
 * 4. Backend data models are mapped to frontend models
 */

/**
 * Transform a venue object from the API to the frontend format
 * @param {Object} venue - Raw venue data from API
 * @returns {Object} Transformed venue object
 */
export const transformVenue = (venue) => {
  if (!venue) return null;
  
  return {
    id: venue.id,
    name: venue.name || 'Unnamed Venue',
    description: venue.description || '',
    address: venue.address || {},
    location: venue.location || { lat: 0, lng: 0 },
    contact: venue.contact || {},
    facilities: Array.isArray(venue.facilities) ? venue.facilities : [],
    images: Array.isArray(venue.images) ? venue.images : [],
    rating: typeof venue.rating === 'number' ? venue.rating : 0,
    reviewCount: venue.reviewCount || 0,
    priceRange: venue.priceRange || '$$',
    isActive: Boolean(venue.isActive),
    openingHours: venue.openingHours || {},
    createdAt: venue.createdAt ? new Date(venue.createdAt) : null,
    updatedAt: venue.updatedAt ? new Date(venue.updatedAt) : null,
    // Add any additional fields with defaults as needed
    ...venue // Spread any additional fields we don't explicitly handle
  };
};

/**
 * Transform a list of venues
 * @param {Array} venues - Array of venue objects from API
 * @returns {Array} Transformed array of venue objects
 */
export const transformVenues = (venues = []) => {
  return venues.map(transformVenue).filter(Boolean);
};

/**
 * Transform a booking object from the API to the frontend format
 * @param {Object} booking - Raw booking data from API
 * @returns {Object} Transformed booking object
 */
export const transformBooking = (booking) => {
  if (!booking) return null;
  
  return {
    id: booking.id,
    userId: booking.userId,
    venueId: booking.venueId,
    courtId: booking.courtId,
    startTime: booking.startTime ? new Date(booking.startTime) : null,
    endTime: booking.endTime ? new Date(booking.endTime) : null,
    status: booking.status || 'pending',
    paymentStatus: booking.paymentStatus || 'pending',
    amount: typeof booking.amount === 'number' ? booking.amount : 0,
    currency: booking.currency || 'USD',
    notes: booking.notes || '',
    createdAt: booking.createdAt ? new Date(booking.createdAt) : null,
    updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : null,
    // Include related data if available
    venue: booking.venue ? transformVenue(booking.venue) : null,
    user: booking.user ? transformUser(booking.user) : null,
    ...booking // Spread any additional fields
  };
};

/**
 * Transform a list of bookings
 * @param {Array} bookings - Array of booking objects from API
 * @returns {Array} Transformed array of booking objects
 */
export const transformBookings = (bookings = []) => {
  return bookings.map(transformBooking).filter(Boolean);
};

/**
 * Transform booking list response with pagination
 * @param {Object} response - API response with bookings and pagination
 * @returns {Object} Transformed bookings with pagination info
 */
export const transformBookingList = (response) => {
  if (!response) return { bookings: [], pagination: {} };
  
  return {
    bookings: transformBookings(response.bookings || response.data || []),
    pagination: {
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 10,
      totalPages: response.totalPages || Math.ceil((response.total || 0) / (response.limit || 10))
    }
  };
};

/**
 * Transform a user object from the API to the frontend format
 * @param {Object} user - Raw user data from API
 * @returns {Object} Transformed user object
 */
export const transformUser = (user) => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User',
    avatar: user.avatar || '',
    phone: user.phone || '',
    role: user.role || 'user',
    isEmailVerified: Boolean(user.isEmailVerified),
    isActive: user.isActive !== false, // Default to true if not specified
    preferences: user.preferences || {},
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : null,
    ...user // Spread any additional fields
  };
};

/**
 * Transform a review object from the API to the frontend format
 * @param {Object} review - Raw review data from API
 * @returns {Object} Transformed review object
 */
export const transformReview = (review) => {
  if (!review) return null;
  
  return {
    id: review.id,
    userId: review.userId,
    venueId: review.venueId,
    bookingId: review.bookingId,
    rating: typeof review.rating === 'number' ? Math.min(Math.max(review.rating, 1), 5) : 3, // Clamp between 1-5
    comment: review.comment || '',
    images: Array.isArray(review.images) ? review.images : [],
    likes: typeof review.likes === 'number' ? review.likes : 0,
    isLiked: Boolean(review.isLiked),
    status: review.status || 'approved',
    createdAt: review.createdAt ? new Date(review.createdAt) : null,
    updatedAt: review.updatedAt ? new Date(review.updatedAt) : null,
    // Include related data if available
    user: review.user ? transformUser(review.user) : null,
    venue: review.venue ? transformVenue(review.venue) : null,
    ...review // Spread any additional fields
  };
};

/**
 * Transform a list of reviews
 * @param {Array} reviews - Array of review objects from API
 * @returns {Array} Transformed array of review objects
 */
export const transformReviews = (reviews = []) => {
  return reviews.map(transformReview).filter(Boolean);
};

/**
 * Transform a paginated API response
 * @param {Object} response - Raw paginated response from API
 * @param {Function} itemTransformer - Function to transform each item
 * @returns {Object} Transformed paginated response
 */
export const transformPaginatedResponse = (response, itemTransformer) => {
  if (!response) return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  
  const items = Array.isArray(response.items) ? response.items : [];
  const transformedItems = itemTransformer ? items.map(itemTransformer) : items;
  
  return {
    items: transformedItems,
    total: typeof response.total === 'number' ? response.total : 0,
    page: typeof response.page === 'number' ? response.page : 1,
    limit: typeof response.limit === 'number' ? response.limit : items.length || 10,
    totalPages: typeof response.totalPages === 'number' ? response.totalPages : 1,
    hasNextPage: Boolean(response.hasNextPage),
    hasPreviousPage: Boolean(response.hasPreviousPage),
    ...response // Spread any additional fields
  };
};

/**
 * Transform an error response from the API
 * @param {Error|Object} error - Error object or API error response
 * @returns {Object} Standardized error object
 */
export const transformError = (error) => {
  if (!error) {
    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      errors: null
    };
  }
  
  // Handle Axios error
  if (error.response) {
    const { status, data } = error.response;
    
    return {
      message: data?.message || error.message || 'An error occurred',
      code: data?.code || `HTTP_${status}`,
      status,
      errors: data?.errors || null,
      originalError: error
    };
  }
  
  // Handle network errors
  if (error.request) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      status: 0,
      originalError: error
    };
  }
  
  // Handle other errors
  return {
    message: error.message || 'An error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    status: error.status || 500,
    originalError: error
  };
};

// Export all transformers
export default {
  transformVenue,
  transformVenues,
  transformBooking,
  transformBookings,
  transformUser,
  transformReview,
  transformReviews,
  transformPaginatedResponse,
  transformError
};
