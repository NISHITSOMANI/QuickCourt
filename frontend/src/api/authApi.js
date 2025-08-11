import api from './config'
import { mockAuthApi, shouldUseMockApi } from './mockApi'

export const authApi = {
  // Register new user
  register: (userData) => {
    return api.post('/auth/register', userData)
  },

  // Login user
  login: (credentials) => {
    return api.post('/auth/login', credentials)
  },

  // Logout user
  logout: () => {
    return api.post('/auth/logout')
  },

  // Get current user
  getMe: async () => {
    if (shouldUseMockApi()) {
      return await mockAuthApi.getMe()
    }
    try {
      return await api.get('/auth/me')
    } catch (error) {
      console.warn('API unavailable, using mock data:', error.message)
      return await mockAuthApi.getMe()
    }
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh', { refreshToken })
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email })
  },

  // Reset password
  resetPassword: (token, password) => {
    return api.post('/auth/reset-password', { token, password })
  },

  // Verify email
  verifyEmail: (data) => {
    return api.post('/auth/verify-email', data)
  },

  // Resend verification code
  resendVerificationCode: (data) => {
    return api.post('/auth/resend-verification', data)
  },
}
