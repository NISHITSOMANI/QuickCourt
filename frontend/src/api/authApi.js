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
      console.log('Making login request to:', '/auth/login');
      console.log('API base URL should be:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true, // Important for receiving cookies
        // Don't retry login on failure
        retry: {
          retries: 0
        }
      });

      console.log('Login response:', response); // Debug log
      
      // Handle error responses first
      if (!response.data || response.data.success === false) {
        const errorMessage = response.data?.message || 'Login failed';
        throw new Error(errorMessage);
      }
      
      // Handle different response formats
      let user, accessToken;
      
      // Format 1: response.data contains user and token directly
      if (response.data.user && response.data.token) {
        user = response.data.user;
        accessToken = response.data.token;
      } 
      // Format 2: response.data.data contains user and accessToken
      else if (response.data.data?.user && response.data.data?.accessToken) {
        user = response.data.data.user;
        accessToken = response.data.data.accessToken;
      }
      // Format 3: response.data contains user and accessToken directly
      else if (response.data.user && response.data.accessToken) {
        user = response.data.user;
        accessToken = response.data.accessToken;
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Unexpected response format from server');
      }
      
      if (!user || !accessToken) {
        throw new Error('Invalid login response: Missing user or token');
      }
      
      // Ensure user has a role before transforming
      if (!user.role) {
        console.warn('User role is missing in login response, defaulting to "user"');
        user.role = 'user'; // Default role
      }
      
      // Transform user data and return with tokens
      const transformedUser = transformUser(user);
      console.log('Transformed user after login:', transformedUser);
      
      return {
        data: {
          user: transformedUser,
          accessToken: accessToken,
          token: accessToken // For backward compatibility
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // More specific error messages based on status code
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          toast.error('Invalid email or password');
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
   * @returns {Promise<Object>} - User profile data
   */
  getMe: async () => {
    try {
      const response = await api.get('/auth/me', {
        // Don't retry on 401 (unauthorized)
        retry: {
          retryIf: (error) => !error.response || error.response.status !== 401
        }
      });
      
      return transformUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
      
      // Call the backend logout endpoint
      await api.post('/auth/logout');
      
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
   * Request a password reset OTP
   * @param {string} email - User's email address
   * @returns {Promise<{message: string, email: string, otpExpiry: string}>}
   */
  forgotPassword: async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const response = await api.post('/auth/forgot-password', { email }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('OTP sent to your email');
      return {
        message: response.data.message,
        email: response.data.email,
        otpExpiry: response.data.otpExpiry
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Don't reveal if the email exists or not for security
      if (error.response?.status === 404) {
        toast.success('If an account exists with this email, an OTP has been sent');
        return { 
          message: 'If an account exists with this email, an OTP has been sent',
          email
        };
      }
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
      
      throw error;
    }
  },

  /**
   * Verify OTP for password reset
   * @param {string} email - User's email address
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<{message: string, resetToken: string, resetTokenExpiry: string}>}
   */
  verifyOtp: async (email, otp) => {
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    try {
      const response = await api.post('/auth/verify-otp', { email, otp }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('OTP verified successfully');
      return {
        message: response.data.message,
        resetToken: response.data.resetToken,
        resetTokenExpiry: response.data.resetTokenExpiry
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid OTP. Please check and try again.');
        } else if (error.response.status === 401) {
          toast.error('OTP has expired. Please request a new one.');
        } else if (error.response.status === 404) {
          toast.error('No password reset request found for this email.');
        } else if (error.response.status === 429) {
          toast.error('Too many attempts. Please try again later.');
        } else {
          toast.error('Failed to verify OTP. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Reset password using a reset token from OTP verification
   * @param {string} token - Password reset token from OTP verification
   * @param {string} password - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<{message: string, email: string}>}
   */
  resetPassword: async (token, password, confirmPassword) => {
    if (!token || !password || !confirmPassword) {
      throw new Error('Token, password and confirm password are required');
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      throw new Error('Passwords do not match');
    }

    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        password,
        confirmPassword
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't retry on failure
        retry: false
      });
      
      toast.success('Password reset successful. You can now log in with your new password.');
      return {
        message: response.data.message,
        email: response.data.email
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          toast.error('Invalid or expired reset token');
        } else if (error.response.status === 401) {
          toast.error('Password reset token has expired. Please start the process again.');
        } else if (error.response.status === 422) {
          const errorMsg = error.response.data?.errors?.[0]?.msg || 'Password does not meet requirements';
          toast.error(errorMsg);
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
