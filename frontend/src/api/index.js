/**
 * Central export for all API modules
 * 
 * This allows importing APIs like:
 * import { authApi, venueApi, bookingApi, reviewApi, profileApi } from '../api'
 */

// Import all API modules
import * as authApi from './authApi';
import * as bookingApi from './bookingApi';
import * as profileApi from './profileApi';
import * as reviewApi from './reviewApi';
import * as venueApi from './venueApi';

// Re-export all modules
export { authApi };
export { bookingApi };
export { profileApi };
export { reviewApi };
export { venueApi };

// Default export with all APIs
export default {
  authApi,
  bookingApi,
  profileApi,
  reviewApi,
  venueApi,
};

// Base API configuration is already handled in config.js
