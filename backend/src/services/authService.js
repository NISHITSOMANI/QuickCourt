const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { logBusiness, logSecurity } = require('../config/logger');
const emailService = require('./emailService');
const ServiceCircuitBreaker = require('../utils/circuitBreaker');

class AuthService {
  constructor() {
    // Initialize circuit breakers for critical operations
    this.loginBreaker = new ServiceCircuitBreaker(
      'auth-login',
      this._loginInternal.bind(this),
      { timeout: 5000 } // 5s timeout for login
    );

    this.registerBreaker = new ServiceCircuitBreaker(
      'auth-register',
      this._registerInternal.bind(this),
      { timeout: 8000 } // 8s timeout for registration
    );

    this.refreshTokenBreaker = new ServiceCircuitBreaker(
      'auth-refresh-token',
      this._refreshTokenInternal.bind(this)
    );
  }
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
   * Register a new user with circuit breaker protection
   */
  async register(userData, req) {
    return this.registerBreaker.execute(userData, req);
  }

  /**
   * Internal registration logic (wrapped by circuit breaker)
   */
  async _registerInternal(userData, req) {
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
   * Login user with circuit breaker protection
   */
  async login(email, password, req) {
    return this.loginBreaker.execute(email, password, req);
  }

  /**
   * Internal login logic (wrapped by circuit breaker)
   */
  async _loginInternal(email, password, req) {
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
   * Refresh access token with circuit breaker protection
   */
  async refreshToken(refreshToken) {
    return this.refreshTokenBreaker.execute(refreshToken);
  }

  /**
   * Internal refresh token logic (wrapped by circuit breaker)
   */
  async _refreshTokenInternal(refreshToken) {
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
   * Forgot password - Step 1: Request OTP
   */
  async forgotPassword(email, req) {
    try {
      const user = await User.findOne({ email });

      // 1. Check if user exists and is not an admin
      if (!user || user.role === 'admin') {
        // Security: Don't reveal that the user does not exist or is an admin.
        logSecurity('PASSWORD_RESET_ATTEMPT_NONEXISTENT_OR_ADMIN', req, { email });
        return { message: 'If an account with that email exists, an OTP has been sent.' };
      }

      // 2. Generate and save OTP
      const otp = user.generatePasswordResetOtp();
      await user.save({ validateBeforeSave: false });

      // 3. Send OTP via email
      try {
        await emailService.sendPasswordResetOtpEmail(user.email, user.name, otp);
        logBusiness('PASSWORD_RESET_OTP_SENT', user._id, { email: user.email });
      } catch (emailError) {
        // If email fails, clear the OTP fields to allow a new request
        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new AppError('Failed to send OTP. Please try again later.', 500);
      }

      return { 
        message: 'OTP sent to your registered email.',
        email: user.email, // Return masked email for display
        otpExpiry: 10 // OTP expires in 10 minutes
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify OTP for password reset - Step 2
   */
  async verifyPasswordResetOtp(email, otp) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError('Invalid request', 400);
      }

      // This will verify the OTP and generate a reset token if valid
      const resetToken = await user.verifyPasswordResetOtp(otp);

      return {
        message: 'OTP verified successfully',
        resetToken,
        resetTokenExpiry: 10 // Token expires in 10 minutes
      };
    } catch (error) {
      if (error.message.includes('OTP') || error.message.includes('expired') || error.message.includes('attempts')) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to verify OTP. Please try again.', 400);
    }
  }

  /**
   * Reset password - Step 3: Set new password with valid reset token
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Hash the incoming token to find the user
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // 2. Find user by token and check expiration
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }, // Check if the token is not expired
      });

      if (!user) {
        throw new AppError('Password reset token is invalid or has expired.', 400);
      }

      // 3. Set the new password and clear reset token
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpAttempts = 0;

      // The 'pre-save' middleware on the User model will automatically hash the password
      await user.save();

      // 4. Invalidate all existing refresh tokens for this user for security
      const RefreshToken = require('../models/RefreshToken');
      await RefreshToken.deleteMany({ userId: user._id });

      // 5. Send confirmation email
      try {
        await emailService.sendPasswordResetConfirmationEmail(user.email, user.name);
      } catch (emailError) {
        // Log but don't fail the password reset if email fails
        console.error('Failed to send password reset confirmation email:', emailError);
      }

      logBusiness('PASSWORD_RESET_COMPLETED', user._id, { email: user.email });

      return { 
        message: 'Your password has been reset successfully. Please log in with your new password.',
        email: user.email
      };
    } catch (error) {
      if (error.message.includes('token') || error.message.includes('expired')) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to reset password. Please try again.', 400);
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

  /**
   * Change password for an authenticated user
   */
  async changePassword(userId, currentPassword, newPassword, req) {
    try {
      // 1. Find user and select the password field
      const user = await User.findById(userId).select('+password');

      if (!user) {
        // This should not happen if the user is authenticated, but as a safeguard
        throw new AppError('User not found.', 404);
      }

      // 2. Verify the current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        logSecurity('PASSWORD_CHANGE_INVALID_CURRENT', req, { userId });
        throw new AppError('Your current password is incorrect.', 401);
      }

      // 3. Set the new password
      user.password = newPassword;
      await user.save();

      // 4. Invalidate all refresh tokens for this user
      const RefreshToken = require('../models/RefreshToken');
      await RefreshToken.deleteMany({ userId: user._id });

      logBusiness('PASSWORD_CHANGE_COMPLETED', userId, { email: user.email });

      return { message: 'Password changed successfully. Please log in again with your new password.' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
