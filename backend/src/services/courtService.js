const Court = require('../models/Court');
const Venue = require('../models/Venue');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

class CourtService {
  /**
   * Get all courts for a venue
   */
  async getCourtsByVenue(venueId) {
    try {
      const courts = await Court.find({ venue: venueId, status: 'active' }).lean();
      return courts;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get court by ID
   */
  async getCourtById(courtId) {
    try {
      const court = await Court.findById(courtId).lean();
      return court;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new court
   */
  async createCourt(venueId, courtData, ownerId) {
    try {
      // Verify venue ownership
      const venue = await Venue.findById(venueId);
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }
      
      if (venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Not authorized to add courts to this venue', 403);
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
      
      logger.info('Court created', { courtId: court._id, venueId, ownerId });
      
      // Clear cache
      await cacheService.del(`venue:${venueId}`);
      
      return court;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update court
   */
  async updateCourt(courtId, updateData, userId) {
    try {
      const court = await Court.findById(courtId).populate('venue');
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      // Check ownership (unless admin)
      if (court.venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to update this court', 403);
        }
      }
      
      // Update court
      Object.assign(court, updateData);
      await court.save();
      
      logger.info('Court updated', { courtId, userId, updates: Object.keys(updateData) });
      
      // Clear cache
      await cacheService.del(`venue:${court.venue._id}`);
      
      return court;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete court
   */
  async deleteCourt(courtId, userId) {
    try {
      const court = await Court.findById(courtId).populate('venue');
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      // Check ownership (unless admin)
      if (court.venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to delete this court', 403);
        }
      }
      
      // Delete court
      await Court.findByIdAndDelete(courtId);
      
      // Update venue total courts count
      const venue = court.venue;
      venue.totalCourts = await Court.countDocuments({ venue: venue._id });
      await venue.save();
      
      logger.info('Court deleted', { courtId, userId });
      
      // Clear cache
      await cacheService.del(`venue:${venue._id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get court availability for a specific date
   */
  async getCourtAvailability(courtId, date) {
    try {
      const court = await Court.findById(courtId);
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      const availability = await court.isAvailable(date);
      
      return {
        courtId,
        courtName: court.name,
        sportType: court.sportType,
        date,
        available: availability,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Block court slot
   */
  async blockCourtSlot(courtId, date, startTime, endTime, reason, ownerId) {
    try {
      const court = await Court.findById(courtId).populate('venue');
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      // Check ownership
      if (court.venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Not authorized to block slots for this court', 403);
      }
      
      const block = await court.blockSlot(date, startTime, endTime, reason, ownerId);
      
      logger.info('Court slot blocked', { courtId, date, startTime, endTime, ownerId });
      
      // Clear cache
      await cacheService.del(`venue:${court.venue._id}`);
      
      return block;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unblock court slot
   */
  async unblockCourtSlot(courtId, blockId, ownerId) {
    try {
      const court = await Court.findById(courtId).populate('venue');
      
      if (!court) {
        throw new AppError('Court not found', 404);
      }
      
      // Check ownership
      if (court.venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Not authorized to unblock slots for this court', 403);
      }
      
      await court.unblockSlot(blockId);
      
      logger.info('Court slot unblocked', { courtId, blockId, ownerId });
      
      // Clear cache
      await cacheService.del(`venue:${court.venue._id}`);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CourtService();
