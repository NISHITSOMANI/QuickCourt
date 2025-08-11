import api from './config'

export const venueApi = {
  // Get all venues with filters
  getVenues: (params = {}) => {
    return api.get('/venues', { params })
  },

  // Get popular venues
  getPopularVenues: (limit = 10) => {
    return api.get('/venues/popular', { params: { limit } })
  },

  // Get venue by ID
  getVenueById: (id) => {
    return api.get(`/venues/${id}`)
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
  getVenueCourts: (venueId) => {
    return api.get(`/venues/${venueId}/courts`)
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
