const Timeslot = require('../models/Timeslot');
const Venue = require('../models/Venue');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

class TimeslotService {
  /**
   * Get timeslots for a venue on a specific date
   */
  async getTimeslotsByVenue(venueId, date) {
    try {
      const timeslots = await Timeslot.find({ venue: venueId, date }).lean();
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new timeslot
   */
  async createTimeslot(venueId, timeslotData, ownerId) {
    try {
      // Verify venue ownership
      const venue = await Venue.findById(venueId);
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }
      
      if (venue.owner.toString() !== ownerId.toString()) {
        throw new AppError('Not authorized to create timeslots for this venue', 403);
      }
      
      // Create timeslot
      const timeslot = new Timeslot({
        ...timeslotData,
        venue: venueId,
      });
      
      await timeslot.save();
      
      logger.info('Timeslot created', { timeslotId: timeslot._id, venueId, ownerId });
      
      // Clear cache
      await cacheService.del(`venue:${venueId}`);
      
      return timeslot;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update timeslot
   */
  async updateTimeslot(timeslotId, updateData, userId) {
    try {
      const timeslot = await Timeslot.findById(timeslotId).populate('venue');
      
      if (!timeslot) {
        throw new AppError('Timeslot not found', 404);
      }
      
      // Check ownership (unless admin)
      if (timeslot.venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to update this timeslot', 403);
        }
      }
      
      // Update timeslot
      Object.assign(timeslot, updateData);
      await timeslot.save();
      
      logger.info('Timeslot updated', { timeslotId, userId, updates: Object.keys(updateData) });
      
      // Clear cache
      await cacheService.del(`venue:${timeslot.venue._id}`);
      
      return timeslot;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete timeslot
   */
  async deleteTimeslot(timeslotId, userId) {
    try {
      const timeslot = await Timeslot.findById(timeslotId).populate('venue');
      
      if (!timeslot) {
        throw new AppError('Timeslot not found', 404);
      }
      
      // Check ownership (unless admin)
      if (timeslot.venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to delete this timeslot', 403);
        }
      }
      
      // Delete timeslot
      await Timeslot.findByIdAndDelete(timeslotId);
      
      logger.info('Timeslot deleted', { timeslotId, userId });
      
      // Clear cache
      await cacheService.del(`venue:${timeslot.venue._id}`);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TimeslotService();
