import api from './config'

export const profileApi = {
  // Get current user profile
  getProfile: () => {
    return api.get('/profile')
  },

  // Update user profile
  updateProfile: (profileData) => {
    return api.put('/profile', profileData)
  },

  // Get user bookings
  getUserBookings: (params = {}) => {
    return api.get('/profile/bookings', { params })
  },

  // Get owner earnings (owner only)
  getOwnerEarnings: (params = {}) => {
    return api.get('/profile/earnings', { params })
  },

  // Get owner stats (owner only)
  getOwnerStats: (params = {}) => {
    return api.get('/profile/stats', { params })
  },

  // Upload profile avatar
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
