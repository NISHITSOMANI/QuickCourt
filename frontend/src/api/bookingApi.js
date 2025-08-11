import api from './config'
import { mockBookingApi, shouldUseMockApi } from './mockApi'

export const bookingApi = {
  // Create new booking
  createBooking: (bookingData) => {
    return api.post('/bookings', bookingData)
  },

  // Get user's bookings
  getMyBookings: async (params = {}) => {
    if (shouldUseMockApi()) {
      return await mockBookingApi.getMyBookings(params)
    }
    try {
      return await api.get('/bookings/my', { params })
    } catch (error) {
      console.warn('API unavailable, using mock data:', error.message)
      return await mockBookingApi.getMyBookings(params)
    }
  },

  // Get booking by ID
  getBookingById: (id) => {
    return api.get(`/bookings/${id}`)
  },

  // Cancel booking
  cancelBooking: (id) => {
    return api.put(`/bookings/${id}/cancel`)
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
}
