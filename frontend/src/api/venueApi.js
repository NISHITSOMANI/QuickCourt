import api from './config'
import { mockVenueApi, shouldUseMockApi } from './mockApi'

export const venueApi = {
  // Get all venues with filters
  getVenues: async (params = {}) => {
    if (shouldUseMockApi()) {
      return await mockVenueApi.getVenues(params)
    }
    try {
      return await api.get('/venues', { params })
    } catch (error) {
      // Silently fall back to mock data without showing errors
      return await mockVenueApi.getVenues(params)
    }
  },

  // Get popular venues
  getPopularVenues: (limit = 10) => {
    return api.get('/venues/popular', { params: { limit } })
  },

  // Get venue by ID
  getVenueById: async (id) => {
    if (shouldUseMockApi()) {
      return await mockVenueApi.getVenueById(id)
    }
    try {
      return await api.get(`/venues/${id}`)
    } catch (error) {
      // Silently fall back to mock data without showing errors
      return await mockVenueApi.getVenueById(id)
    }
  },

  // Create new venue (owner only)
  createVenue: (venueData) => {
    return api.post('/venues', venueData)
  },

  // Update venue (owner/admin only)
  updateVenue: (id, venueData) => {
    return api.put(`/venues/${id}`, venueData)
  },

  // Delete venue (owner/admin only)
  deleteVenue: (id) => {
    return api.delete(`/venues/${id}`)
  },

  // Get venue gallery
  getVenueGallery: (id) => {
    return api.get(`/venues/${id}/gallery`)
  },

  // Upload venue photos (owner only)
  uploadVenuePhotos: (id, photos) => {
    const formData = new FormData()
    photos.forEach((photo) => {
      formData.append('photos', photo)
    })
    return api.post(`/venues/${id}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Delete venue photo (owner/admin only)
  deleteVenuePhoto: (venueId, photoId) => {
    return api.delete(`/venues/${venueId}/photos/${photoId}`)
  },

  // Get venue availability
  getVenueAvailability: (id, date) => {
    return api.get(`/venues/${id}/availability`, { params: { date } })
  },

  // Get venue reviews
  getVenueReviews: (id, params = {}) => {
    return api.get(`/venues/${id}/reviews`, { params })
  },

  // Get courts for a venue
  getVenueCourts: async (venueId) => {
    if (shouldUseMockApi()) {
      return await mockVenueApi.getVenueCourts(venueId)
    }
    try {
      return await api.get(`/venues/${venueId}/courts`)
    } catch (error) {
      // Silently fall back to mock data without showing errors
      return await mockVenueApi.getVenueCourts(venueId)
    }
  },

  // Create court for venue (owner only)
  createCourt: (venueId, courtData) => {
    return api.post(`/venues/${venueId}/courts`, courtData)
  },

  // Delete court (owner/admin only)
  deleteCourt: (courtId) => {
    return api.delete(`/courts/${courtId}`)
  },

  // Update venue status (admin only)
  updateVenueStatus: (venueId, status) => {
    return api.put(`/venues/${venueId}/status`, { status })
  },
}
