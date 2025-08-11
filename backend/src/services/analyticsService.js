const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class AnalyticsService {
  /**
   * Get booking trends for a user (owner or admin)
   */
  async getBookingTrends(userId, options = {}) {
    try {
      const { dateFrom, dateTo, granularity = 'daily' } = options;
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      const matchQuery = {
        createdAt: dateQuery,
      };
      
      // If user is owner, filter by their venues
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user.role === 'owner') {
        const venues = await Venue.find({ owner: userId }).select('_id');
        const venueIds = venues.map(venue => venue._id);
        matchQuery.venue = { $in: venueIds };
      }
      
      // Build group query based on granularity
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
      
      const trends = await Booking.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      
      return trends;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get earnings analytics for a user (owner or admin)
   */
  async getEarningsAnalytics(userId, options = {}) {
    try {
      const { dateFrom, dateTo, granularity = 'daily' } = options;
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      const matchQuery = {
        createdAt: dateQuery,
        status: 'completed',
      };
      
      // If user is owner, filter by their venues
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user.role === 'owner') {
        const venues = await Venue.find({ owner: userId }).select('_id');
        const venueIds = venues.map(venue => venue._id);
        matchQuery.venue = { $in: venueIds };
      }
      
      // Build group query based on granularity
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
      
      const earnings = await Payment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: groupBy,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      
      return earnings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get peak hours for bookings
   */
  async getPeakHours(userId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      const matchQuery = {
        date: dateQuery,
      };
      
      // If user is owner, filter by their venues
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user.role === 'owner') {
        const venues = await Venue.find({ owner: userId }).select('_id');
        const venueIds = venues.map(venue => venue._id);
        matchQuery.venue = { $in: venueIds };
      }
      
      const peakHours = await Booking.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$startTime',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
      
      return peakHours;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get most active sports (admin only)
   */
  async getMostActiveSports(options = {}) {
    try {
      const { dateFrom, dateTo, limit = 10 } = options;
      
      // Build date query
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) dateQuery.$lte = new Date(dateTo);
      
      const sports = await Booking.aggregate([
        { $match: { createdAt: dateQuery } },
        {
          $lookup: {
            from: 'courts',
            localField: 'court',
            foreignField: '_id',
            as: 'courtDetails',
          },
        },
        { $unwind: '$courtDetails' },
        {
          $group: {
            _id: '$courtDetails.sportType',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
      ]);
      
      return sports;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
