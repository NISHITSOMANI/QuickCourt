import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';
import { api } from '../api/config';
import { useNavigate, useLocation } from 'react-router-dom';

// Helper function to transform user data from various API response formats
const transformUser = (userData) => {
  if (!userData) return null;
  
  // Handle different user data structures from various API responses
  let user = userData;
  
  // If user data is nested under a 'user' property
  if (userData.user && typeof userData.user === 'object') {
    user = { ...userData.user };
  }
  
  // If user data is in a 'data' property (common in some API responses)
  if (userData.data && typeof userData.data === 'object') {
    user = { ...userData.data };
  }
  
  // Ensure we have a valid user object
  if (!user || typeof user !== 'object') {
    console.error('Invalid user data in transformUser:', userData);
    return null;
  }
  
  // Extract and normalize user properties
  const transformedUser = {
    id: user._id || user.id || null,
    name: user.name || user.fullName || '',
    email: user.email || '',
    // Role normalization - ensure it's always lowercase and has a default
    role: (user.role || '').toLowerCase() || 'user',
    avatar: user.avatar || user.profilePicture || '',
    isVerified: Boolean(user.isVerified || user.verified || false),
    // Preserve all other user properties
    ...user
  };
  
  // Log transformation for debugging
  console.log('Transformed user data:', transformedUser);
  
  return transformedUser;
};

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
  
  // Check if user is authenticated on app load - NO REDIRECTS FOR LANDING PAGE
  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check if on landing page to prevent redirects
      if (window.location.pathname === '/') {
        dispatch({ type: 'AUTH_FAIL', payload: null });
        return;
      }

      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        dispatch({ type: 'AUTH_FAIL', payload: null });
        return;
      }
      
      try {
        // Try to get user data with existing token
        // getMe already transforms the user data
        const user = await authApi.getMe();
        handleAuthSuccess({
          user,
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
  
  // Get dashboard route based on user role
  const getDashboardRoute = useCallback((role = null) => {
    const userRole = role || state.user?.role;
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'owner':
        return '/owner';
      case 'user':
        return '/user';
      default:
        return '/';
    }
  }, [state.user]);

  // Login user
  const login = useCallback(async (credentials, redirectTo = null) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      console.log('Attempting login with credentials:', credentials);
      const response = await authApi.login(credentials);
      console.log('Login response:', response);
      
      // Extract user and token from response (handling different formats)
      let user, accessToken, refreshToken;
      
      // Format 1: Direct response with user and token
      if (response?.data?.user && (response?.data?.token || response?.data?.accessToken)) {
        user = response.data.user;
        accessToken = response.data.token || response.data.accessToken;
      }
      // Format 2: Nested data object with user and accessToken
      else if (response?.data?.data?.user && response?.data?.data?.accessToken) {
        user = response.data.data.user;
        accessToken = response.data.data.accessToken;
      }
      // Format 3: Direct accessToken and user in response.data
      else if (response?.data?.accessToken && response?.data?.user) {
        user = response.data.user;
        accessToken = response.data.accessToken;
      }
      
      // If we still don't have a user, try to get it from the response data
      if ((!user || !accessToken) && response?.data) {
        // Try to extract user from response data
        user = response.data.user || response.data.data || response.data;
        accessToken = response.data.token || response.data.accessToken || accessToken;
      }
      
      // Ensure we have a valid user object with role
      if (!user || typeof user !== 'object') {
        console.error('Invalid user data in login response:', user);
        throw new Error('Invalid user data received from server');
      }
      
      // Transform user data to ensure consistent format
      user = transformUser(user);
      
      // Log the transformed user for debugging
      console.log('Transformed user after login:', user);
      
      // Ensure user has a role
      if (!user.role) {
        console.warn('User role is missing in the login response, defaulting to "user"');
        user.role = 'user'; // Default role
      }
      
      // Try to get refresh token from cookies if available
      refreshToken = response?.headers?.['set-cookie']?.[0]?.split(';')[0]?.split('=')[1] || null;
      
      if (!user || !accessToken) {
        console.error('Invalid login response format - missing user or token:', response);
        throw new Error('Invalid login response format: Missing user or token');
      }
      
      // Store tokens and update auth state
      storeTokens(accessToken, refreshToken);
      
      // Ensure we have the latest user data including role
      try {
        // Fetch fresh user data to ensure we have all fields including role
        const freshUser = await authApi.getMe();
        if (freshUser) {
          user = transformUser(freshUser);
        }
      } catch (error) {
        console.warn('Failed to fetch fresh user data after login, using login response data:', error);
      }
      
      // Final check for role
      if (!user.role) {
        console.warn('User role still missing after refresh, defaulting to "user"');
        user.role = 'user';
      }
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { 
          user: user, 
          token: accessToken, 
          refreshToken,
          permissions: user.permissions || []
        }
      });
      
      // Get the appropriate dashboard route based on user role
      const redirectPath = redirectTo || getDashboardRoute(user.role);
      console.log('Login successful, user role:', user.role, 'redirecting to:', redirectPath);
      
      return { 
        success: true, 
        user, 
        redirectTo: redirectPath 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_FAIL', payload: errorMessage });
      return { 
        success: false, 
        error: errorMessage,
        details: error.response?.data || null
      };
    }
  }, [getDashboardRoute]);

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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout,
    register,
    refreshAccessToken,
    updateProfile,
    updateUser,
    hasRole,
    hasAnyRole,
    hasPermission,
    clearError,
    getDashboardRoute: getDashboardRoute
  }), [
    state,
    login,
    logout,
    register,
    refreshAccessToken,
    updateProfile,
    updateUser,
    hasRole,
    hasAnyRole,
    hasPermission,
    clearError,
    getDashboardRoute
  ]);

  // Use a stable reference for the provider value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Create and export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
