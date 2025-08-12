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
 * Forgot password - Step 1: Request OTP
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  const result = await authService.forgotPassword(email, req);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      email: result.email,
      otpExpiry: result.otpExpiry
    }
  });
});

/**
 * Verify OTP - Step 2: Verify OTP and get reset token
 */
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400);
  }

  const result = await authService.verifyPasswordResetOtp(email, otp);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      resetToken: result.resetToken,
      resetTokenExpiry: result.resetTokenExpiry
    }
  });
});

/**
 * Reset password - Step 3: Set new password with valid reset token
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  // 1. Validate that passwords match
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match.', 400);
  }

  // 2. The token from the request body is the raw token from verifyOtp step
  const result = await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      email: result.email
    }
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
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 1. Validate that new passwords match
  if (newPassword !== confirmPassword) {
    throw new AppError('New passwords do not match.', 400);
  }

  const result = await authService.changePassword(
    req.user._id,
    currentPassword,
    newPassword,
    req
  );

  // Clear the refresh token cookie upon successful password change
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: result.message,
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
  verifyOtp,
  resetPassword,
  updateProfile,
  changePassword,
  verifyEmail,
  resendEmailVerification,
};
