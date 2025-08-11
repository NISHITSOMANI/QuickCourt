import api from './config';
import { toast } from 'react-hot-toast';
import { transformUser } from '../utils/apiTransformers';

/**
 * Authentication API service for handling user authentication and account management
 */
export const authApi = {
  /**
   * Register a new user account
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration response with user data and auth token
   */
  /**
   * Register a new user account
   * @param {Object} userData - User registration data (name, email, password, etc.)
   * @returns {Promise<{user: Object, token: string}>} - Registered user data and auth token
   */
  register: async (userData) => {
    if (!userData || !userData.email || !userData.password || !userData.name) {
      throw new Error('Name, email, and password are required');
    }

    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.register(userData);
      toast.success('Registration successful! (demo)');
      return {
        user: transformUser(mockData.user),
        token: mockData.token
      };
    }

    try {
      const response = await api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry registration on failure
        retry: {
          retries: 0
        }
      });
      
      toast.success('Registration successful! Please check your email to verify your account.');
      return {
        user: transformUser(response.data.user),
        token: response.data.token
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid registration data. Please check your input.');
        } else if (error.response.status === 409) {
          toast.error('An account with this email already exists');
        } else {
          toast.error(error.response.data?.message || 'Failed to create account');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Authenticate user and retrieve auth token
   * @param {Object} credentials - User credentials (email and password)
   * @returns {Promise<Object>} - Authentication response with user data and token
   */
  /**
   * Authenticate user and retrieve auth token
   * @param {Object} credentials - User credentials (email and password)
   * @returns {Promise<{user: Object, token: string}>} - User data and auth token
   */
  login: async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await api.post('/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry login on failure
        retry: {
          retries: 0
        }
      });
      
      // Token storage is handled by the interceptor in config.js
      return {
        user: transformUser(response.data.user),
        token: response.data.token
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid email or password');
        } else if (error.response.status === 401) {
          toast.error('Invalid credentials. Please try again.');
        } else if (error.response.status === 403) {
          toast.error('Account not verified. Please check your email.');
        } else if (error.response.status === 429) {
          toast.error('Too many login attempts. Please try again later.');
        } else {
          toast.error('Failed to log in. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Get current authenticated user's profile
   * @returns {Promise<Object>} - User profile data
   */
  /**
   * Get current authenticated user's profile
   * @param {boolean} [forceRefresh=false] - Whether to force a fresh fetch
   * @returns {Promise<Object>} - User profile data
   */
  getMe: async (forceRefresh = false) => {
    const cacheKey = 'current-user';
    
    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.getMe();
      return transformUser(mockData);
    }

    try {
      const response = await api.get('/auth/me', {
        cacheKey: !forceRefresh ? cacheKey : undefined,
        cacheOptions: {
          ttl: 5 * 60 * 1000, // 5 minutes cache for user profile
          useCache: !forceRefresh
        },
        // Don't retry on 401 (unauthorized)
        retry: {
          retryIf: (error) => !error.response || error.response.status !== 401
        }
      });
      
      return transformUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // If we have a cached response and it's not a 401, return it with a warning
      if (error.response?.status !== 401) {
        const cachedResponse = api.getCachedResponse('GET:/auth/me');
        if (cachedResponse) {
          toast('Using cached user data', { icon: '⚠️' });
          return transformUser(cachedResponse.data);
        }
      }
      
      // 401 errors are handled by the interceptor in config.js
      throw error;
    }
  },

  /**
   * Logout the current user
   * @returns {Promise<Object>} - Logout confirmation
   */
  logout: async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Call the backend logout endpoint if not using mock
      if (!shouldUseMockApi()) {
        await api.post('/auth/logout')
      } else {
        await mockAuthApi.logout()
      }
      
      toast.success('You have been logged out')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on the server, clear the token locally
      localStorage.removeItem('token')
      throw error
    }
  },

  /**
   * Request a password reset email
   * @param {string} email - User's email address
   * @returns {Promise<{message: string}>}
   */
  forgotPassword: async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }

    if (shouldUseMockApi()) {
      await mockAuthApi.forgotPassword(email);
      toast.success('Password reset link sent to your email (demo)');
      return { message: 'Password reset email sent' };
    }

    try {
      const response = await api.post('/auth/forgot-password', { email }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('Password reset link sent to your email');
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Don't reveal if the email exists or not for security
      if (error.response?.status === 404) {
        toast.success('If an account exists with this email, a password reset link has been sent');
        return { message: 'If an account exists with this email, a password reset link has been sent' };
      }
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to send password reset email. Please try again.');
      }
      
      throw error;
    }
  },

  /**
   * Reset password using a reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>}
   */
  resetPassword: async (token, newPassword) => {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.resetPassword(token, newPassword);
      toast.success('Password reset successful. You can now log in with your new password. (demo)');
      return mockData;
    }

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('Password reset successful. You can now log in with your new password.');
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid or expired reset token');
        } else if (error.response.status === 401) {
          toast.error('Password reset link has expired. Please request a new one.');
        } else if (error.response.status === 422) {
          toast.error('Password does not meet requirements');
        } else {
          toast.error('Failed to reset password. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user profile
   */
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user profile
   */
  updateProfile: async (userData) => {
    if (!userData) {
      throw new Error('User data is required');
    }

    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.updateProfile(userData);
      toast.success('Profile updated successfully (demo)');
      return transformUser(mockData);
    }

    try {
      const response = await api.patch('/auth/me', userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate user cache after successful update
        onSuccess: () => {
          api.invalidateCache('current-user');
          // Also invalidate any cached user data that might be affected
          const cacheKeys = api.getCacheKeys();
          cacheKeys
            .filter(key => key.includes('user-') || key.includes('profile-'))
            .forEach(key => api.invalidateCache(key));
        }
      });
      
      toast.success('Profile updated successfully');
      return transformUser(response.data);
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid profile data. Please check your input.');
        } else if (error.response.status === 401) {
          toast.error('Please log in to update your profile');
        } else if (error.response.status === 409) {
          toast.error('This email is already in use');
        } else {
          toast.error('Failed to update profile. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>}
   */
  changePassword: async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new Error('Current and new password are required');
    }

    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully (demo)');
      return mockData;
    }

    try {
      const response = await api.post(
        '/auth/change-password', 
        { currentPassword, newPassword },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          // Don't retry on failure
          retry: false
        }
      );
      
      toast.success('Password changed successfully');
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid password. Please check your current password.');
        } else if (error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response.status === 422) {
          toast.error('New password does not meet requirements');
        } else {
          toast.error('Failed to change password. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Verify user's email with a verification token
   * @param {string} token - Email verification token
   * @returns {Promise<{message: string}>}
   */
  verifyEmail: async (token) => {
    if (!token) {
      throw new Error('Verification token is required');
    }

    if (shouldUseMockApi()) {
      const mockData = await mockAuthApi.verifyEmail(token);
      toast.success('Email verified successfully (demo)');
      return mockData;
    }

    try {
      const response = await api.post('/auth/verify-email', { token }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Invalidate user cache after successful verification
        onSuccess: () => {
          api.invalidateCache('current-user');
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('Email verified successfully');
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid verification token');
        } else if (error.response.status === 401) {
          toast.error('Verification link has expired. Please request a new one.');
        } else if (error.response.status === 409) {
          toast.success('Email already verified');
          return { message: 'Email already verified' };
        } else {
          toast.error('Failed to verify email. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Resend verification email
   * @param {string} email - User's email address
   * @returns {Promise<{message: string}>}
   */
  resendVerificationEmail: async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }

    if (shouldUseMockApi()) {
      await mockAuthApi.resendVerificationEmail(email);
      toast.success('Verification email sent. Please check your inbox. (demo)');
      return { message: 'Verification email sent' };
    }

    try {
      const response = await api.post('/auth/resend-verification', { email }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('Verification email sent. Please check your inbox.');
      return response.data;
    } catch (error) {
      console.error('Resend verification email error:', error);
      
      // Don't reveal if the email exists or not for security
      if (error.response?.status === 404 || error.response?.status === 409) {
        toast.success('If an account exists with this email, a verification link has been sent');
        return { message: 'If an account exists with this email, a verification link has been sent' };
      }
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to resend verification email. Please try again.');
      }
      
      throw error;
    }
  },

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} - New token and user data
   */
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token')
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear invalid token
      localStorage.removeItem('token')
      throw error
    }
  }
}
