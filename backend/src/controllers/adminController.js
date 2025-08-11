const venueService = require('../services/venueService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Get admin statistics
 */
const getAdminStats = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, granularity = 'day' } = req.query;

  // Build date range
  const now = new Date();
  const startDate = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = dateTo ? new Date(dateTo) : now;

  // Get overall statistics
  const User = require('../models/User');
  const Venue = require('../models/Venue');
  const Booking = require('../models/Booking');

  const [userStats, venueStats, bookingStats] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    Venue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  // Get trending data based on granularity
  let groupByFormat;
  switch (granularity) {
    case 'hour':
      groupByFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
      break;
    case 'day':
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      break;
    case 'week':
      groupByFormat = { $week: '$createdAt' };
      break;
    case 'month':
      groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      break;
    default:
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  const trendingData = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupByFormat,
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      dateRange: { from: startDate, to: endDate },
      users: userStats,
      venues: venueStats,
      bookings: bookingStats,
      trending: trendingData,
    },
  });
});

/**
 * Get pending facilities for approval
 */
const getPendingFacilities = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const Venue = require('../models/Venue');
  const [venues, total] = await Promise.all([
    Venue.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email phone')
      .lean(),
    Venue.countDocuments({ status: 'pending' }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      venues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Get facility details for admin review
 */
const getFacilityDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const venue = await venueService.getVenueById(id);

  res.status(200).json({
    success: true,
    data: { venue },
  });
});

/**
 * Approve facility
 */
const approveFacility = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approved, comments } = req.body;

  if (approved) {
    const venue = await venueService.approveVenue(id, req.user._id, comments);
    res.status(200).json({
      success: true,
      message: 'Facility approved successfully',
      data: { venue },
    });
  } else {
    const venue = await venueService.rejectVenue(id, req.user._id, comments);
    res.status(200).json({
      success: true,
      message: 'Facility rejected successfully',
      data: { venue },
    });
  }
});

/**
 * Reject facility
 */
const rejectFacility = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;

  const venue = await venueService.rejectVenue(id, req.user._id, comments);

  res.status(200).json({
    success: true,
    message: 'Facility rejected successfully',
    data: { venue },
  });
});

/**
 * Get all users
 */
const getUsers = catchAsync(async (req, res) => {
  const { role, status, q, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const User = require('../models/User');
  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Ban user
 */
const banUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason, until } = req.body;

  const User = require('../models/User');
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot ban admin users',
    });
  }

  user.status = 'banned';
  user.banReason = reason;
  user.bannedUntil = until ? new Date(until) : null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User banned successfully',
    data: { user },
  });
});

/**
 * Unban user
 */
const unbanUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const User = require('../models/User');
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.status = 'active';
  user.banReason = undefined;
  user.bannedUntil = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User unbanned successfully',
    data: { user },
  });
});

/**
 * Get reports
 */
const getReports = catchAsync(async (req, res) => {
  const { type, status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // For now, return empty array as Report model is not implemented
  // In production, implement Report model and actual reporting system
  res.status(200).json({
    success: true,
    data: {
      reports: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Take action on report
 */
const takeReportAction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  // For now, return success as Report model is not implemented
  res.status(200).json({
    success: true,
    message: 'Report action taken successfully',
    data: { action, notes },
  });
});

module.exports = {
  getAdminStats,
  getPendingFacilities,
  getFacilityDetails,
  approveFacility,
  rejectFacility,
  getUsers,
  banUser,
  unbanUser,
  getReports,
  takeReportAction,
};
