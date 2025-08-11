const authService = require('../services/authService');
const bookingService = require('../services/bookingService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Get user profile
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
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
 * Get user bookings
 */
const getProfileBookings = catchAsync(async (req, res) => {
  const result = await bookingService.getUserBookings(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get owner earnings (for venue owners)
 */
const getEarnings = catchAsync(async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - owners only',
    });
  }

  const { dateFrom, dateTo } = req.query;

  // Get venues owned by this user
  const Venue = require('../models/Venue');
  const venues = await Venue.find({ owner: req.user._id }).select('_id');
  const venueIds = venues.map(v => v._id);

  // Calculate earnings from bookings
  const Booking = require('../models/Booking');
  const matchStage = {
    venue: { $in: venueIds },
    status: { $in: ['confirmed', 'completed'] },
    paymentStatus: 'paid',
  };

  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
    if (dateTo) matchStage.date.$lte = new Date(dateTo);
  }

  const earnings = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$totalAmount' },
        totalBookings: { $sum: 1 },
        averageBookingValue: { $avg: '$totalAmount' },
      },
    },
  ]);

  const result = earnings[0] || {
    totalEarnings: 0,
    totalBookings: 0,
    averageBookingValue: 0,
  };

  res.status(200).json({
    success: true,
    data: { earnings: result },
  });
});

/**
 * Get owner statistics
 */
const getOwnerStats = catchAsync(async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - owners only',
    });
  }

  const { period = 'month' } = req.query;

  // Get date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get venues owned by this user
  const Venue = require('../models/Venue');
  const venues = await Venue.find({ owner: req.user._id });
  const venueIds = venues.map(v => v._id);

  // Get booking statistics
  const Booking = require('../models/Booking');
  const bookingStats = await Booking.aggregate([
    {
      $match: {
        venue: { $in: venueIds },
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Get venue statistics
  const venueStats = {
    total: venues.length,
    approved: venues.filter(v => v.status === 'approved').length,
    pending: venues.filter(v => v.status === 'pending').length,
    rejected: venues.filter(v => v.status === 'rejected').length,
  };

  res.status(200).json({
    success: true,
    data: {
      period,
      dateRange: { from: startDate, to: now },
      venues: venueStats,
      bookings: bookingStats,
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getProfileBookings,
  getEarnings,
  getOwnerStats,
};
