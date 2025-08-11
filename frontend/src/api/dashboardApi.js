import api from './config'

// Admin Dashboard APIs
export const adminApi = {
  // Get all users with filters
  getUsers: (params = {}) => {
    return api.get('/admin/users', { params })
  },

  // Get specific user details
  getUserById: (userId) => {
    return api.get(`/admin/users/${userId}`)
  },

  // Update user
  updateUser: (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData)
  },

  // Delete user
  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`)
  },

  // Get all venues for admin
  getVenues: (params = {}) => {
    return api.get('/admin/venues', { params })
  },

  // Approve venue
  approveVenue: (venueId) => {
    return api.patch(`/admin/venues/${venueId}/approve`)
  },

  // Reject venue
  rejectVenue: (venueId, reason) => {
    return api.patch(`/admin/venues/${venueId}/reject`, { reason })
  },

  // Delete venue
  deleteVenue: (venueId) => {
    return api.delete(`/admin/venues/${venueId}`)
  },

  // Get platform analytics
  getAnalytics: (params = {}) => {
    return api.get('/admin/analytics', { params })
  },

  // Get system health
  getSystemHealth: () => {
    return api.get('/admin/system/health')
  }
}

// Owner Dashboard APIs
export const ownerApi = {
  // Get owner's venues
  getVenues: () => {
    return api.get('/owner/venues')
  },

  // Get specific venue
  getVenue: (venueId) => {
    return api.get(`/owner/venues/${venueId}`)
  },

  // Create venue
  createVenue: (venueData) => {
    return api.post('/owner/venues', venueData)
  },

  // Update venue
  updateVenue: (venueId, venueData) => {
    return api.put(`/owner/venues/${venueId}`, venueData)
  },

  // Delete venue
  deleteVenue: (venueId) => {
    return api.delete(`/owner/venues/${venueId}`)
  },

  // Get venue bookings
  getVenueBookings: (venueId, params = {}) => {
    return api.get(`/owner/venues/${venueId}/bookings`, { params })
  },

  // Add court to venue
  addCourt: (venueId, courtData) => {
    return api.post(`/owner/venues/${venueId}/courts`, courtData)
  },

  // Get owner analytics
  getAnalytics: (params = {}) => {
    return api.get('/owner/analytics', { params })
  },

  // Get revenue data
  getRevenue: (params = {}) => {
    return api.get('/owner/revenue', { params })
  }
}

// User Dashboard APIs
export const userApi = {
  // Get user's bookings
  getBookings: (params = {}) => {
    return api.get('/bookings', { params })
  },

  // Get specific booking
  getBooking: (bookingId) => {
    return api.get(`/bookings/${bookingId}`)
  },

  // Cancel booking
  cancelBooking: (bookingId) => {
    return api.delete(`/bookings/${bookingId}`)
  },

  // Get payment history
  getPaymentHistory: (params = {}) => {
    return api.get('/user/payments', { params })
  },

  // Get favorite venues
  getFavoriteVenues: () => {
    return api.get('/user/favorites')
  },

  // Add venue to favorites
  addToFavorites: (venueId) => {
    return api.post('/user/favorites', { venueId })
  },

  // Remove venue from favorites
  removeFromFavorites: (venueId) => {
    return api.delete(`/user/favorites/${venueId}`)
  },

  // Get user analytics/stats
  getUserStats: () => {
    return api.get('/user/stats')
  }
}

// Common APIs used across dashboards
export const dashboardApi = {
  // Get venues (public)
  getVenues: (params = {}) => {
    return api.get('/venues', { params })
  },

  // Get venue details
  getVenueDetails: (venueId) => {
    return api.get(`/venues/${venueId}`)
  },

  // Get court availability
  getCourtAvailability: (courtId, date) => {
    return api.get(`/courts/${courtId}/availability`, { params: { date } })
  },

  // Create booking
  createBooking: (bookingData) => {
    return api.post('/bookings', bookingData)
  },

  // Get user profile
  getProfile: () => {
    return api.get('/profile')
  },

  // Update profile
  updateProfile: (profileData) => {
    return api.put('/profile', profileData)
  }
}

export default {
  admin: adminApi,
  owner: ownerApi,
  user: userApi,
  common: dashboardApi
}
