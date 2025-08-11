const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class OwnerService {
  /**
   * Get owner stats
   */
  async getOwnerStats(ownerId, options = {}) {
    try {
      const { dateFrom, dateTo, granularity = 'daily' } = options;
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      // Get venues owned by user
      const venues = await Venue.find({ owner: ownerId }).select('_id');
      const venueIds = venues.map(venue => venue._id);
      
      if (venueIds.length === 0) {
        return { totalBookings: 0, totalRevenue: 0, bookingTrends: [] };
      }
      
      // Get booking stats
      const totalBookings = await Booking.countDocuments({
        venue: { $in: venueIds },
        createdAt: dateQuery,
      });
      
      // Get revenue stats
      const revenueResult = await Payment.aggregate([
        { $match: { venue: { $in: venueIds }, createdAt: dateQuery, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
      
      // Get booking trends based on granularity
      let groupBy;
      switch (granularity) {
        case 'hourly':
          groupBy = {
            $dateToString: {
              format: '%Y-%m-%d %H:00',
              date: '$createdAt',
            },
          };
          break;
        case 'daily':
          groupBy = {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          };
          break;
        case 'weekly':
          groupBy = {
            $dateToString: {
              format: '%Y-W%V',
              date: '$createdAt',
            },
          };
          break;
        case 'monthly':
          groupBy = {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
            },
          };
          break;
        default:
          groupBy = {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          };
      }
      
      const bookingTrends = await Booking.aggregate([
        { $match: { venue: { $in: venueIds }, createdAt: dateQuery } },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      
      return { totalBookings, totalRevenue, bookingTrends };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get owner venues
   */
  async getOwnerVenues(ownerId, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      
      const venues = await Venue.find({ owner: ownerId })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
        
      return venues;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venue bookings
   */
  async getVenueBookings(venueId, ownerId, options = {}) {
    try {
      // Verify venue ownership
      const venue = await Venue.findById(venueId);
      if (!venue || venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Venue not found or not authorized', 404);
      }
      
      const { status, dateFrom, dateTo, page, limit } = options;
      
      const query = { venue: venueId };
      if (status) query.status = status;
      
      // Build date query
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }
      
      const bookings = await Booking.find(query)
        .sort('-createdAt')
        .skip((parseInt(page) || 1 - 1) * (parseInt(limit) || 10))
        .limit(parseInt(limit) || 10)
        .populate('user', 'name email')
        .populate('court', 'name sportType')
        .lean();
        
      return bookings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add court to venue
   */
  async addCourtToVenue(venueId, courtData, ownerId) {
    try {
      // Verify venue ownership
      const venue = await Venue.findById(venueId);
      if (!venue || venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Venue not found or not authorized', 404);
      }
      
      // Create court
      const court = new Court({
        ...courtData,
        venue: venueId,
      });
      
      await court.save();
      
      // Update venue total courts count
      venue.totalCourts = await Court.countDocuments({ venue: venueId });
      await venue.save();
      
      logger.info('Court added to venue', { courtId: court._id, venueId, ownerId });
      
      return court;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update court
   */
  async updateCourt(courtId, updateData, ownerId) {
    try {
      const court = await Court.findById(courtId).populate('venue');
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      // Check ownership
      if (court.venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Not authorized to update this court', 403);
      }
      
      // Update court
      Object.assign(court, updateData);
      await court.save();
      
      logger.info('Court updated', { courtId, ownerId, updates: Object.keys(updateData) });
      
      return court;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get owner transactions
   */
  async getOwnerTransactions(ownerId, options = {}) {
    try {
      const { dateFrom, dateTo, page, limit } = options;
      
      // Get venues owned by user
      const venues = await Venue.find({ owner: ownerId }).select('_id');
      const venueIds = venues.map(venue => venue._id);
      
      if (venueIds.length === 0) {
        return [];
      }
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      const transactions = await Payment.find({
        venue: { $in: venueIds },
        createdAt: dateQuery,
      })
        .sort('-createdAt')
        .skip((parseInt(page) || 1 - 1) * (parseInt(limit) || 10))
        .limit(parseInt(limit) || 10)
        .populate('booking', 'date startTime endTime')
        .populate('user', 'name email')
        .lean();
        
      return transactions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OwnerService();
