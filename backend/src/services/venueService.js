const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');
const { logBusiness } = require('../config/logger');
const cacheService = require('../config/cache');
const emailService = require('./emailService');

class VenueService {
  /**
   * Create a new venue
   */
  async createVenue(venueData, ownerId) {
    try {
      const venue = new Venue({
        ...venueData,
        owner: ownerId,
      });

      await venue.save();

      logBusiness('VENUE_CREATED', ownerId, {
        venueId: venue._id,
        venueName: venue.name,
        location: venue.address.city,
      });

      // Clear cache
      await cacheService.del('venues:popular');
      await cacheService.del(`venues:owner:${ownerId}`);

      return venue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venues with filters and pagination
   */
  async getVenues(filters = {}, options = {}) {
    try {
      const {
        sportType,
        priceMin,
        priceMax,
        venueType,
        rating,
        q,
        page = 1,
        limit = 10,
        sort = '-rating.average',
      } = { ...filters, ...options };

      // Build query
      const query = { status: 'approved' };

      if (sportType) {
        query.sports = { $in: [sportType] };
      }

      if (priceMin !== undefined || priceMax !== undefined) {
        query.startingPrice = {};
        if (priceMin !== undefined) query.startingPrice.$gte = priceMin;
        if (priceMax !== undefined) query.startingPrice.$lte = priceMax;
      }

      if (venueType) {
        query.venueType = venueType;
      }

      if (rating) {
        query['rating.average'] = { $gte: rating };
      }

      if (q) {
        query.$text = { $search: q };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with caching for popular queries
      const cacheKey = `venues:${JSON.stringify({ query, sort, skip, limit })}`;
      
      const result = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const [venues, total] = await Promise.all([
            Venue.find(query)
              .sort(sort)
              .skip(skip)
              .limit(parseInt(limit))
              .populate('owner', 'name email')
              .lean(),
            Venue.countDocuments(query),
          ]);

          return {
            venues,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(total / limit),
              totalItems: total,
              itemsPerPage: parseInt(limit),
              hasNext: skip + venues.length < total,
              hasPrev: page > 1,
            },
          };
        },
        300 // 5 minutes cache
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get popular venues
   */
  async getPopularVenues(limit = 10) {
    try {
      const cacheKey = 'venues:popular';
      
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await Venue.find({ status: 'approved' })
            .sort({ bookingCount: -1, 'rating.average': -1 })
            .limit(parseInt(limit))
            .populate('owner', 'name')
            .lean();
        },
        600 // 10 minutes cache
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venue by ID
   */
  async getVenueById(venueId) {
    try {
      const cacheKey = `venue:${venueId}`;
      
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const venue = await Venue.findById(venueId)
            .populate('owner', 'name email phone')
            .lean();

          if (!venue) {
            throw new AppError('Venue not found', 404);
          }

          // Get courts for this venue
          const courts = await Court.find({ venue: venueId, status: 'active' })
            .sort({ pricePerHour: 1 })
            .lean();

          return {
            ...venue,
            courts,
          };
        },
        300 // 5 minutes cache
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update venue
   */
  async updateVenue(venueId, updateData, userId) {
    try {
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      // Check ownership (unless admin)
      if (venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to update this venue', 403);
        }
      }

      // Update venue
      Object.assign(venue, updateData);
      await venue.save();

      logBusiness('VENUE_UPDATED', userId, {
        venueId: venue._id,
        updates: Object.keys(updateData),
      });

      // Clear cache
      await cacheService.del(`venue:${venueId}`);
      await cacheService.del('venues:popular');
      await cacheService.del(`venues:owner:${venue.owner}`);

      return venue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete venue
   */
  async deleteVenue(venueId, userId) {
    try {
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      // Check ownership (unless admin)
      if (venue.owner.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to delete this venue', 403);
        }
      }

      // Check for active bookings
      const activeBookings = await Booking.countDocuments({
        venue: venueId,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date() },
      });

      if (activeBookings > 0) {
        throw new AppError('Cannot delete venue with active bookings', 400);
      }

      // Delete venue and associated courts
      await Promise.all([
        Venue.findByIdAndDelete(venueId),
        Court.deleteMany({ venue: venueId }),
      ]);

      logBusiness('VENUE_DELETED', userId, {
        venueId,
        venueName: venue.name,
      });

      // Clear cache
      await cacheService.del(`venue:${venueId}`);
      await cacheService.del('venues:popular');
      await cacheService.del(`venues:owner:${venue.owner}`);

      return { message: 'Venue deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add photos to venue
   */
  async addPhotos(venueId, photos, userId) {
    try {
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      // Check ownership
      if (venue.owner.toString() !== userId.toString()) {
        throw new AppError('Not authorized to update this venue', 403);
      }

      // Add photos
      const newPhotos = photos.map(photo => ({
        url: photo.url || photo,
        caption: photo.caption || '',
        isPrimary: venue.photos.length === 0, // First photo is primary
      }));

      venue.photos.push(...newPhotos);
      await venue.save();

      // Clear cache
      await cacheService.del(`venue:${venueId}`);

      return venue.photos;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete photo from venue
   */
  async deletePhoto(venueId, photoId, userId) {
    try {
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      // Check ownership
      if (venue.owner.toString() !== userId.toString()) {
        throw new AppError('Not authorized to update this venue', 403);
      }

      // Remove photo
      venue.photos.id(photoId).remove();
      await venue.save();

      // Clear cache
      await cacheService.del(`venue:${venueId}`);

      return { message: 'Photo deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venue availability for a specific date
   */
  async getVenueAvailability(venueId, date) {
    try {
      const venue = await this.getVenueById(venueId);
      const courts = venue.courts;

      const availability = await Promise.all(
        courts.map(async (court) => {
          // Get existing bookings for this court on this date
          const bookings = await Booking.find({
            court: court._id,
            date: new Date(date),
            status: { $in: ['pending', 'confirmed'] },
          }).select('startTime endTime').lean();

          // Generate time slots (assuming 1-hour slots from 6 AM to 11 PM)
          const timeSlots = [];
          for (let hour = 6; hour <= 22; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            // Check if slot is available
            const isBooked = bookings.some(booking => 
              (startTime >= booking.startTime && startTime < booking.endTime) ||
              (endTime > booking.startTime && endTime <= booking.endTime)
            );

            // Check if court is available at this time
            const isCourtAvailable = court.isAvailable ? 
              court.isAvailable(date, startTime, endTime) : true;

            timeSlots.push({
              startTime,
              endTime,
              available: !isBooked && isCourtAvailable,
              price: court.pricePerHour,
            });
          }

          return {
            courtId: court._id,
            courtName: court.name,
            sportType: court.sportType,
            timeSlots,
          };
        })
      );

      return {
        venueId,
        venueName: venue.name,
        date,
        courts: availability,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get venues by owner
   */
  async getVenuesByOwner(ownerId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const cacheKey = `venues:owner:${ownerId}:${page}:${limit}`;
      
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const [venues, total] = await Promise.all([
            Venue.find({ owner: ownerId })
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(parseInt(limit))
              .lean(),
            Venue.countDocuments({ owner: ownerId }),
          ]);

          return {
            venues,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(total / limit),
              totalItems: total,
              itemsPerPage: parseInt(limit),
            },
          };
        },
        300 // 5 minutes cache
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve venue (admin only)
   */
  async approveVenue(venueId, adminId, comments = '') {
    try {
      const venue = await Venue.findById(venueId).populate('owner');
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      if (venue.status !== 'pending') {
        throw new AppError('Venue is not pending approval', 400);
      }

      venue.status = 'approved';
      venue.approvedAt = new Date();
      await venue.save();

      logBusiness('VENUE_APPROVED', adminId, {
        venueId,
        venueName: venue.name,
        ownerId: venue.owner._id,
      });

      // Send approval email to owner
      try {
        await emailService.sendVenueApprovalEmail(
          venue.owner.email,
          venue.owner.name,
          venue
        );
      } catch (emailError) {
        // Log but don't fail the approval
        console.error('Failed to send venue approval email:', emailError);
      }

      // Clear cache
      await cacheService.del(`venue:${venueId}`);
      await cacheService.del('venues:popular');

      return venue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject venue (admin only)
   */
  async rejectVenue(venueId, adminId, comments) {
    try {
      const venue = await Venue.findById(venueId).populate('owner');
      
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      venue.status = 'rejected';
      venue.rejectedAt = new Date();
      venue.rejectionReason = comments;
      await venue.save();

      logBusiness('VENUE_REJECTED', adminId, {
        venueId,
        venueName: venue.name,
        ownerId: venue.owner._id,
        reason: comments,
      });

      // Clear cache
      await cacheService.del(`venue:${venueId}`);

      return venue;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new VenueService();
