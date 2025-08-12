/**
 * Central export for all API modules
 * 
 * This allows importing APIs like:
 * import { authApi, venueApi, bookingApi, reviewApi, profileApi } from '../api'
 */

// Import all API modules
import { authApi } from './authApi';
import { bookingApi } from './bookingApi';
import { profileApi } from './profileApi';
import { reviewApi } from './reviewApi';
import venueApi from './venueApi';
import { ownerApi } from './ownerApi';
import { dashboardApi } from './dashboardApi';
import { adminApi } from './adminApi';
import { paymentApi } from './paymentApi';
import { notificationApi } from './notificationApi';
import { courtApi } from './courtApi';

// Re-export all modules
export { authApi };
export { bookingApi };
export { profileApi };
export { reviewApi };
export { venueApi };
export { ownerApi };
export { dashboardApi };
export { adminApi };
export { paymentApi };
export { notificationApi };
export { courtApi };

// Default export with all APIs
export default {
  authApi,
  bookingApi,
  profileApi,
  reviewApi,
  venueApi,
  ownerApi,
  dashboardApi,
  adminApi,
  paymentApi,
  notificationApi,
  courtApi,
};

// Base API configuration is already handled in config.js
