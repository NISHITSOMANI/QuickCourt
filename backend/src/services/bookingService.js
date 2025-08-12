const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Venue = require('../models/Venue');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { logBusiness } = require('../config/logger');
const lockService = require('./lockService');
const emailService = require('./emailService');
const paymentService = require('./paymentService');
const ServiceCircuitBreaker = require('../utils/circuitBreaker');

class BookingService {
  constructor() {
    // Initialize circuit breakers for critical operations
    this.bookingBreaker = new ServiceCircuitBreaker(
      'booking-service',
      this._createBookingInternal.bind(this),
      {
        timeout: 10000, // 10s timeout for booking operations
        errorThresholdPercentage: 30, // Trip circuit if 30% of requests fail
        resetTimeout: 60000, // 1 minute before attempting to close the circuit
      }
    );

    this.cancellationBreaker = new ServiceCircuitBreaker(
      'booking-cancellation',
      this._cancelBookingInternal.bind(this),
      {
        timeout: 5000, // 5s timeout for cancellation
        errorThresholdPercentage: 20, // Be more sensitive to cancellation failures
        resetTimeout: 30000, // 30 seconds before attempting to close the circuit
      }
    );
  }
  /**
   * Create a new booking with circuit breaker protection
   */
  async createBooking(bookingData, userId) {
    try {
      return await this.bookingBreaker.execute(bookingData, userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Booking service is currently unavailable. Please try again later.', 503);
    }
  }

  /**
   * Internal method to create booking (wrapped by circuit breaker)
   */
  async _createBookingInternal(bookingData, userId) {
    try {
      const { courtId, venueId, date, startTime, endTime, paymentMethod } = bookingData;
      const lockKey = `booking:${courtId}:${date}:${startTime}:${endTime}`;
      const lockOwner = `user:${userId}:${Date.now()}`;

      return await lockService.withLock(lockKey, lockOwner, async () => {
      // Validate court and venue
      const [court, venue] = await Promise.all([
        Court.findById(courtId).populate('venue'),
        Venue.findById(venueId)
      ]);

      if (!court) throw new AppError('Court not found', 404);
      if (!venue) throw new AppError('Venue not found', 404);
      if (court.venue._id.toString() !== venueId) {
        throw new AppError('Court does not belong to this venue', 400);
      }
      if (venue.status !== 'approved') {
        throw new AppError('Venue is not available for booking', 400);
      }
      if (!court.isAvailable(date, startTime, endTime)) {
        throw new AppError('Court is not available at this time', 400);
      }

      // Check for conflicting bookings
      const hasConflict = await Booking.checkConflict(courtId, date, startTime, endTime);
      if (hasConflict) {
        throw new AppError('Time slot is already booked', 409);
      }

      // Calculate duration and total amount
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const duration = (endTotalMinutes - startTotalMinutes) / 60;
      const totalAmount = duration * court.pricePerHour;

      // Create booking
      const booking = new Booking({
        user: userId,
        venue: venueId,
        court: courtId,
        date: new Date(date),
        startTime,
        endTime,
        duration,
        totalAmount,
        paymentMethod,
        metadata: {
          source: 'web',
          userAgent: bookingData.userAgent,
          ipAddress: bookingData.ipAddress,
        },
      });

      await booking.save();

      // Populate booking details
      await booking.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'venue', select: 'name address' },
        { path: 'court', select: 'name sportType' }
      ]);

      logBusiness('BOOKING_CREATED', userId, {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        venueId,
        courtId,
        date,
        timeSlot: `${startTime}-${endTime}`,
        amount: totalAmount,
      });

      // Process payment if payment method is provided
      if (paymentMethod && paymentMethod !== 'cash') {
        try {
          const paymentResult = await paymentService.processPayment({
            bookingId: booking._id,
            amount: totalAmount,
            method: paymentMethod,
            userId,
          });

          if (paymentResult.success) {
            booking.paymentStatus = 'paid';
            booking.paymentId = paymentResult.paymentId;
            booking.transactionId = paymentResult.transactionId;
            booking.status = 'confirmed';
            await booking.save();
          }
        } catch (paymentError) {
          // Payment failed, but booking is created
          console.error('Payment processing failed:', paymentError);
        }
      }

      // Update venue and court booking counts
      await Promise.all([
        Venue.findByIdAndUpdate(venueId, {
          $inc: { bookingCount: 1 },
          $set: { 'metadata.lastBooking': new Date() }
        }),
        Court.findByIdAndUpdate(courtId, {
          $inc: { bookingCount: 1 },
          $set: { 'metadata.lastBooking': new Date() }
        })
      ]);

      // Send confirmation email
      try {
        await emailService.sendBookingConfirmationEmail(
          booking.user.email,
          booking.user.name,
          booking
        );
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
      }

      return booking;
      });
    } catch(error) {
      if (error.message.includes('Failed to acquire lock')) {
        throw new AppError('This time slot is being booked by another user. Please try again.', 409);
      }
      throw error;
    }
  }

  /**
   * Get user bookings with filters
   */
  async getUserBookings(userId, filters = {}) {
    try {
      const {
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10
      } = filters;

      const query = { user: userId };

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .sort({ date: -1, startTime: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('venue', 'name address photos')
          .populate('court', 'name sportType')
          .lean(),
        Booking.countDocuments(query)
      ]);

      return {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId, userId, userRole) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('user', 'name email phone')
        .populate('venue', 'name address owner')
        .populate('court', 'name sportType');

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Check access permissions
      const canAccess =
        booking.user._id.toString() === userId || // User owns booking
        booking.venue.owner.toString() === userId || // Venue owner
        userRole === 'admin'; // Admin

      if (!canAccess) {
        throw new AppError('Access denied', 403);
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel booking with circuit breaker protection
   */
  async cancelBooking(bookingId, userId, reason = 'User cancellation') {
    try {
      return await this.cancellationBreaker.execute(bookingId, userId, reason);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Unable to process cancellation at this time. Please try again later.', 503);
    }
  }

  /**
   * Internal method to cancel booking (wrapped by circuit breaker)
   */
  async _cancelBookingInternal(bookingId, userId, reason) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('user', 'name email')
        .populate('venue', 'name')
        .populate('court', 'name');

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      if (booking.user._id.toString() !== userId) {
        throw new AppError('You can only cancel your own bookings', 403);
      }

      if (booking.status === 'cancelled') {
        throw new AppError('Booking is already cancelled', 400);
      }

      if (booking.status === 'completed') {
        throw new AppError('Cannot cancel completed booking', 400);
      }

    // Check cancellation policy (2 hours before booking)
    const now = new Date();
    const bookingDateTime = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      throw new AppError('Cannot cancel booking less than 2 hours before start time', 400);
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;

    // Calculate refund amount (full refund if cancelled more than 24 hours before)
    let refundPercentage = hoursUntilBooking >= 24 ? 1.0 : 0.8; // 80% refund if less than 24 hours
    booking.refundAmount = Math.round(booking.totalAmount * refundPercentage);

    await booking.save();

    logBusiness('BOOKING_CANCELLED', userId, {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      reason,
      refundAmount: booking.refundAmount,
    });

    // Process refund if payment was made
    if (booking.paymentStatus === 'paid') {
      try {
        await paymentService.processRefund({
          bookingId: booking._id,
          amount: booking.refundAmount,
          reason: 'Booking cancellation',
        });
        booking.paymentStatus = 'refunded';
        await booking.save();
      } catch (refundError) {
        console.error('Refund processing failed:', refundError);
        // Don't fail the cancellation if refund fails
      }
    }

    // Send cancellation email
    try {
      await emailService.sendBookingCancellationEmail(
        booking.user.email,
        booking.user.name,
        booking
      );
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    return booking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm booking (owner/admin)
   */
  async confirmBooking(bookingId, userId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('venue', 'owner')
        .populate('user', 'name email');

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

    // Check permissions
    const user = await User.findById(userId);
    const canConfirm =
      booking.venue.owner.toString() === userId ||
      user.role === 'admin';

    if (!canConfirm) {
      throw new AppError('Not authorized to confirm this booking', 403);
    }

    if (booking.status !== 'pending') {
      throw new AppError('Only pending bookings can be confirmed', 400);
    }

    booking.status = 'confirmed';
    await booking.save();

    logBusiness('BOOKING_CONFIRMED', userId, {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
    });

    return booking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venue bookings (for venue owners)
   */
  async getVenueBookings(venueId, ownerId, filters = {}) {
    try {
      // Verify venue ownership
      const venue = await Venue.findById(venueId);
      if (!venue) {
      throw new AppError('Venue not found', 404);
    }

    const user = await User.findById(ownerId);
    if (venue.owner.toString() !== ownerId && user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const {
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = filters;

    const query = { venue: venueId };

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email phone')
        .populate('court', 'name sportType')
        .lean(),
      Booking.countDocuments(query)
    ]);

    return {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update booking status (admin/owner)
   */
  async updateBookingStatus(bookingId, status, userId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('venue', 'owner')
        .populate('user', 'name email');

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

    // Check permissions
    const user = await User.findById(userId);
    const canUpdate =
      booking.venue.owner.toString() === userId ||
      user.role === 'admin';

    if (!canUpdate) {
      throw new AppError('Not authorized to update this booking', 403);
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid booking status', 400);
    }

    booking.status = status;
    await booking.save();

    logBusiness('BOOKING_STATUS_UPDATED', userId, {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      newStatus: status,
    });

    return booking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      circuitBreakers: {
        booking: this.bookingBreaker ? this.bookingBreaker.getStats() : 'not_initialized',
        cancellation: this.cancellationBreaker ? this.cancellationBreaker.getStats() : 'not_initialized',
      },
    };
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(filters = {}) {
    try {
    const { dateFrom, dateTo, venueId, userId } = filters;

    const matchStage = {};

    if (dateFrom || dateTo) {
      matchStage.date = {};
      if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
      if (dateTo) matchStage.date.$lte = new Date(dateTo);
    }

    if (venueId) {
      matchStage.venue = venueId;
    }

    if (userId) {
      matchStage.user = userId;
    }

    const stats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' },
          statusBreakdown: {
            $push: '$status'
          },
          paymentStatusBreakdown: {
            $push: '$paymentStatus'
          }
        }
      },
      {
        $project: {
          totalBookings: 1,
          totalRevenue: 1,
          averageBookingValue: { $round: ['$averageBookingValue', 2] },
          statusBreakdown: 1,
          paymentStatusBreakdown: 1
        }
      }
    ]);

    return stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      statusBreakdown: [],
      paymentStatusBreakdown: []
    };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingService();
