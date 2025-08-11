import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';
import { api } from '../api/config';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: true,
  error: null,
  permissions: [],
  isRefreshing: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken || state.refreshToken,
        isAuthenticated: true,
        loading: false,
        isRefreshing: false,
        error: null,
        permissions: action.payload.permissions || [],
      };
      
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        isRefreshing: false,
        error: action.payload,
      };
      
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        isRefreshing: false,
        error: null,
        permissions: [],
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      
    case 'SET_DEV_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        isRefreshing: false,
        error: null,
      };
      
    case 'REFRESH_TOKEN_START':
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };
      
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isRefreshing: false,
      };
      
    case 'REFRESH_TOKEN_FAIL':
      return {
        ...state,
        isRefreshing: false,
        error: action.payload,
      };
      
    default:
      return state;
  }
};

// Store tokens in localStorage
const storeTokens = (token, refreshToken) => {
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens from localStorage
const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Handle successful authentication
  const handleAuthSuccess = useCallback(({ user, token, refreshToken }) => {
    storeTokens(token, refreshToken);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, token, refreshToken }
    });
  }, []);
  
  // Handle authentication failure
  const handleAuthFail = useCallback((error) => {
    clearTokens();
    dispatch({
      type: 'AUTH_FAIL',
      payload: error?.response?.data?.message || 'Authentication failed'
    });    
    return Promise.reject(error);
  }, []);
  
  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        dispatch({ type: 'AUTH_FAIL', payload: null });
        return;
      }
      
      try {
        // Try to get user data with existing token
        const response = await authApi.getMe();
        handleAuthSuccess({
          user: response.data.user,
          token,
          refreshToken
        });
      } catch (error) {
        // If token is invalid, try to refresh it
        if (error.response?.status === 401 && refreshToken) {
          try {
            await refreshAccessToken();
          } catch (refreshError) {
            handleAuthFail(refreshError);
          }
        } else {
          handleAuthFail(error);
        }
      }
    };

    checkAuth();
  }, [handleAuthSuccess, handleAuthFail]);
  
  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Prevent multiple refresh attempts
    if (state.isRefreshing) {
      return new Promise((resolve, reject) => {
        const checkRefresh = () => {
          if (!state.isRefreshing) {
            resolve();
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }
    
    try {
      dispatch({ type: 'REFRESH_TOKEN_START' });
      
      const response = await authApi.refreshToken({ refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      storeTokens(accessToken, newRefreshToken);
      
      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          token: accessToken,
          refreshToken: newRefreshToken
        }
      });
      
      return accessToken;
    } catch (error) {
      dispatch({
        type: 'REFRESH_TOKEN_FAIL',
        payload: error.response?.data?.message || 'Failed to refresh token'
      });
      
      // If refresh token is invalid, log the user out
      if (error.response?.status === 401) {
        logout();
      }
      
      throw error;
    }
  }, [state.isRefreshing]);
  
  // Login user
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.login(credentials);
      // The authApi.login already returns the transformed user and token
      handleAuthSuccess({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      });
      return response.user;
    } catch (error) {
      return handleAuthFail(error);
    }
  }, [handleAuthSuccess, handleAuthFail]);
  
  // Logout user
  const logout = useCallback(() => {
    // Clear tokens from storage
    clearTokens();
    
    // Reset auth state
    dispatch({ type: 'LOGOUT' });
    
    // Clear any pending requests
    api.clearPendingRequests();
    
    // Redirect to login page
    window.location.href = '/login';
  }, []);
  
  // Register new user
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.register(userData);
      handleAuthSuccess(response.data);
      return response.data.user;
    } catch (error) {
      return handleAuthFail(error);
    }
  }, [handleAuthSuccess, handleAuthFail]);
  
  // Update user profile
  const updateProfile = useCallback(async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          return updateProfile(userData);
        } catch (refreshError) {
          return handleAuthFail(refreshError);
        }
      }
      throw error;
    }
  }, [refreshAccessToken, handleAuthFail]);

  // Role and permission checking utilities with useCallback for performance
  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user]);
  
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(state.user?.role);
  }, [state.user]);
  
  const hasPermission = useCallback((permission) => {
    return state.permissions.includes(permission);
  }, [state.permissions]);
  
  const getDashboardRoute = useCallback(() => {
    if (!state.user?.role) return '/';
    return `/dashboard/${state.user.role}`;
  }, [state.user]);
  
  const canAccessDashboard = useCallback(() => {
    return state.isAuthenticated && state.user?.role;
  }, [state.isAuthenticated, state.user]);
  
  // Update user profile data with development mode support
  const updateUser = useCallback((userData) => {
    // For development: if it's a complete user object, set as dev user
    if (process.env.NODE_ENV === 'development' && userData._id && userData.role && userData.email) {
      dispatch({ type: 'SET_DEV_USER', payload: userData });
    } else {
      dispatch({ type: 'UPDATE_USER', payload: userData });
    }
  }, []);
  
  // Clear any authentication errors
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    hasPermission,
    getDashboardRoute,
    canAccessDashboard,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
