const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { logSecurity } = require('../config/logger');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurity('AUTH_MISSING_TOKEN', req);
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Find user and check if still active
      const user = await User.findById(decoded.id).select('+password');
      
      if (!user) {
        logSecurity('AUTH_USER_NOT_FOUND', req, { userId: decoded.id });
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.status !== 'active') {
        logSecurity('AUTH_USER_INACTIVE', req, { userId: user._id, status: user.status });
        return res.status(401).json({
          success: false,
          message: 'Account is suspended or banned',
        });
      }

      if (user.isLocked) {
        logSecurity('AUTH_USER_LOCKED', req, { userId: user._id });
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked',
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (jwtError) {
      logSecurity('AUTH_INVALID_TOKEN', req, { error: jwtError.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logSecurity('AUTH_ERROR', req, { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      logSecurity('AUTH_INSUFFICIENT_PERMISSIONS', req, { 
        userRole: req.user.role, 
        requiredRoles: roles 
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Optional authentication - attach user if token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership
    const resourceUserId = req[resourceUserField] || req.params.userId || req.body[resourceUserField];
    
    if (req.user._id.toString() !== resourceUserId?.toString()) {
      logSecurity('AUTH_OWNERSHIP_VIOLATION', req, { 
        userId: req.user._id,
        resourceUserId 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    next();
  };
};

/**
 * Check if user owns venue or is admin
 */
const venueOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    const venueId = req.params.venueId || req.params.id || req.body.venueId;
    
    if (!venueId) {
      return res.status(400).json({
        success: false,
        message: 'Venue ID required',
      });
    }

    const Venue = require('../models/Venue');
    const venue = await Venue.findById(venueId);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    if (venue.owner.toString() !== req.user._id.toString()) {
      logSecurity('AUTH_VENUE_OWNERSHIP_VIOLATION', req, { 
        userId: req.user._id,
        venueId,
        venueOwner: venue.owner 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied - not venue owner',
      });
    }

    req.venue = venue;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
    });
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurity('AUTH_RATE_LIMIT_EXCEEDED', req);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
    });
  },
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  ownerOrAdmin,
  venueOwnerOrAdmin,
  authRateLimit,
};
