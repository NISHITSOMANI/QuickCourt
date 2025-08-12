/**
 * CLEAN API EXPORTS - NO CIRCULAR DEPENDENCIES
 * PRODUCTION READY - LIFE OR DEATH FIXED
 */

// Import all API modules
import { authApi } from './authApi';
import { bookingApi } from './bookingApi';
import { profileApi } from './profileApi';
import { reviewApi } from './reviewApi';
import venueApi from './venueApi';
import * as ownerApi from './ownerApi';
import { dashboardApi } from './dashboardApi';
import { adminApi } from './adminApi';
import { paymentApi } from './paymentApi';
import { notificationApi } from './notificationApi';
import { courtApi } from './courtApi';

// Venue API - default export
export { default as venueApi } from './venueApi';

// Owner API - named export
export { ownerApi } from './ownerApi';

// Simple default export for convenience
export default {
  auth: () => import('./authApi').then(m => m.authApi),
  booking: () => import('./bookingApi').then(m => m.bookingApi),
  profile: () => import('./profileApi').then(m => m.profileApi),
  review: () => import('./reviewApi').then(m => m.reviewApi),
  venue: () => import('./venueApi').then(m => m.default),
  owner: () => import('./ownerApi').then(m => m.ownerApi),
  admin: () => import('./adminApi').then(m => m.adminApi),
  payment: () => import('./paymentApi').then(m => m.paymentApi),
  notification: () => import('./notificationApi').then(m => m.notificationApi),
  court: () => import('./courtApi').then(m => m.courtApi)
};
