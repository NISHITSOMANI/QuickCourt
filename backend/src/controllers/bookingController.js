const bookingService = require('../services/bookingService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Create new booking
 */
const createBooking = catchAsync(async (req, res) => {
  const bookingData = {
    ...req.body,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
  };

  const booking = await bookingService.createBooking(bookingData, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking },
  });
});

/**
 * Get user's bookings
 */
const getMyBookings = catchAsync(async (req, res) => {
  const result = await bookingService.getUserBookings(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get booking by ID
 */
const getBookingById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.getBookingById(id, req.user._id, req.user.role);

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

/**
 * Cancel booking
 */
const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await bookingService.cancelBooking(id, req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking },
  });
});

/**
 * Confirm booking (owner/admin)
 */
const confirmBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.confirmBooking(id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Booking confirmed successfully',
    data: { booking },
  });
});

/**
 * Get venue bookings (for venue owners)
 */
const getVenueBookings = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const result = await bookingService.getVenueBookings(venueId, req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get all bookings (admin only)
 */
const getAllBookings = catchAsync(async (req, res) => {
  // Build query filters
  const filters = { ...req.query };
  
  const Booking = require('../models/Booking');
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('venue', 'name address')
      .populate('court', 'name sportType')
      .lean(),
    Booking.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      bookings,
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
 * Update booking status (owner/admin)
 */
const updateBookingStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const booking = await bookingService.updateBookingStatus(id, status, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking },
  });
});

/**
 * Get booking statistics
 */
const getBookingStats = catchAsync(async (req, res) => {
  const filters = { ...req.query };
  
  // Add user-specific filters based on role
  if (req.user.role === 'user') {
    filters.userId = req.user._id;
  } else if (req.user.role === 'owner') {
    // Get venues owned by this user
    const Venue = require('../models/Venue');
    const venues = await Venue.find({ owner: req.user._id }).select('_id');
    filters.venueId = { $in: venues.map(v => v._id) };
  }

  const stats = await bookingService.getBookingStats(filters);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  getVenueBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingStats,
};
