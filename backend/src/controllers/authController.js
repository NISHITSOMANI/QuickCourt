const authService = require('../services/authService');
const { catchAsync } = require('../middleware/errorHandler');
const { logSecurity } = require('../config/logger');

/**
 * Register a new user
 */
const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body, req);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Login user
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password, req);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
});

/**
 * Refresh access token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const cookieRefreshToken = req.cookies?.refreshToken;
  
  const tokenToUse = refreshToken || cookieRefreshToken;
  
  if (!tokenToUse) {
    logSecurity('REFRESH_TOKEN_MISSING', req);
    return res.status(401).json({
      success: false,
      message: 'Refresh token required',
    });
  }

  const result = await authService.refreshToken(tokenToUse);

  // Update refresh token cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
});

/**
 * Logout user
 */
const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const cookieRefreshToken = req.cookies?.refreshToken;
  
  const tokenToUse = refreshToken || cookieRefreshToken;
  
  if (tokenToUse) {
    await authService.logout(tokenToUse);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Get current user profile
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * Forgot password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  const result = await authService.forgotPassword(email, req);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  
  const result = await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Update user profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Verify current password
  const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    logSecurity('PASSWORD_CHANGE_INVALID_CURRENT', req, { userId: req.user._id });
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  req.user.password = newPassword;
  await req.user.save();

  // Invalidate all refresh tokens
  const RefreshToken = require('../models/RefreshToken');
  await RefreshToken.deleteMany({ userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.',
  });
});

/**
 * Verify email
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token required',
    });
  }

  // Find user with verification token
  const User = require('../models/User');
  const user = await User.findOne({ emailVerificationToken: token });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Resend email verification
 */
const resendEmailVerification = catchAsync(async (req, res) => {
  const user = req.user;
  
  if (user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified',
    });
  }

  // Generate new verification token
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  user.emailVerificationToken = verificationToken;
  await user.save();

  // Send verification email (implement as needed)
  // await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

  res.status(200).json({
    success: true,
    message: 'Verification email sent',
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  verifyEmail,
  resendEmailVerification,
};
