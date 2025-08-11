const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { logBusiness, logSecurity } = require('../config/logger');
const emailService = require('./emailService');

class AuthService {
  /**
   * Generate JWT tokens
   */
  generateTokens(userId) {
    const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async register(userData, req) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('User already exists with this email', 400);
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user._id);

      // Store refresh token (in production, use Redis)
      const RefreshToken = require('../models/RefreshToken');
      await RefreshToken.create({
        token: refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Log business event
      logBusiness('USER_REGISTERED', user._id, {
        email: user.email,
        role: user.role,
        source: req?.headers?.['user-agent'],
      });

      // Send welcome email (async)
      emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      return {
        user: user.toJSON(),
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('User already exists with this email', 400);
      }
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password, req) {
    try {
      // Find user by email
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        logSecurity("LOGIN_ATTEMPT_INVALID_EMAIL", req, { email });
        throw new AppError("Invalid email or password", 401);
      }

      // Check if account is locked
      if (user.isLocked) {
        logSecurity("LOGIN_ATTEMPT_LOCKED_ACCOUNT", req, { userId: user._id });
        throw new AppError(
          "Account is temporarily locked due to too many failed attempts",
          423
        );
      }

      // Check if account is active
      if (user.status !== "active") {
        logSecurity("LOGIN_ATTEMPT_INACTIVE_ACCOUNT", req, {
          userId: user._id,
          status: user.status,
        });
        throw new AppError("Account is suspended or banned", 403);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        logSecurity("LOGIN_ATTEMPT_INVALID_PASSWORD", req, { userId: user._id });
        await user.incLoginAttempts();
        throw new AppError("Invalid email or password", 401);
      }

      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      user.lastLogin = new Date();
      await user.save();

      const { accessToken, refreshToken } = this.generateTokens(user._id);

      const RefreshToken = require("../models/RefreshToken");
      await RefreshToken.create({
        token: refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      logBusiness("USER_LOGIN", user._id, {
        email: user.email,
        lastLogin: user.lastLogin,
        source: req?.headers?.["user-agent"],
      });

      return {
        user: user.toJSON(),
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      throw error;
    }
  }


  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Check if refresh token exists in database
      const RefreshToken = require('../models/RefreshToken');
      const storedToken = await RefreshToken.findOne({ 
        token: refreshToken,
        userId: decoded.id,
      });

      if (!storedToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await RefreshToken.deleteOne({ _id: storedToken._id });
        throw new AppError('Refresh token expired', 401);
      }

      // Find user
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user._id);

      // Replace old refresh token with new one
      await RefreshToken.findByIdAndUpdate(storedToken._id, {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        const RefreshToken = require('../models/RefreshToken');
        await RefreshToken.deleteOne({ token: refreshToken });
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email, req) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal if user exists or not
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token to user
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Send reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password?token=${resetToken}`;
      
      try {
        await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
        
        logBusiness('PASSWORD_RESET_REQUESTED', user._id, {
          email: user.email,
          source: req?.headers?.['user-agent'],
        });
      } catch (emailError) {
        // Reset the token fields if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
        throw new AppError('Failed to send password reset email', 500);
      }

      return { message: 'Password reset link sent to your email' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Invalidate all refresh tokens for this user
      const RefreshToken = require('../models/RefreshToken');
      await RefreshToken.deleteMany({ userId: user._id });

      logBusiness('PASSWORD_RESET_COMPLETED', user._id, {
        email: user.email,
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update allowed fields
      const allowedUpdates = ['name', 'phone', 'avatar', 'preferences'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      Object.assign(user, updates);
      await user.save();

      logBusiness('PROFILE_UPDATED', userId, { updates: Object.keys(updates) });

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
