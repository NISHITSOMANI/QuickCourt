const Review = require('../models/Review');
const Venue = require('../models/Venue');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

class ReviewService {
  /**
   * Get reviews for a venue with pagination
   */
  async getReviewsByVenue(venueId, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const sort = options.sort || '-createdAt';
      
      const reviews = await Review.find({ venue: venueId })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name')
        .lean();
        
      return reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new review
   */
  async createReview(venueId, reviewData, userId) {
    try {
      // Verify venue exists
      const venue = await Venue.findById(venueId);
      if (!venue) {
        throw new AppError('Venue not found', 404);
      }
      
      // Check if user already reviewed this venue
      const existingReview = await Review.findOne({ venue: venueId, user: userId });
      if (existingReview) {
        throw new AppError('You have already reviewed this venue', 400);
      }
      
      // Create review
      const review = new Review({
        ...reviewData,
        venue: venueId,
        user: userId,
      });
      
      await review.save();
      
      // Update venue rating
      await this.updateVenueRating(venueId);
      
      logger.info('Review created', { reviewId: review._id, venueId, userId });
      
      return review;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update review
   */
  async updateReview(reviewId, updateData, userId) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new AppError('Review not found', 404);
      }
      
      // Check ownership (unless admin)
      if (review.user.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to update this review', 403);
        }
      }
      
      // Update review
      Object.assign(review, updateData);
      await review.save();
      
      // Update venue rating
      await this.updateVenueRating(review.venue);
      
      logger.info('Review updated', { reviewId, userId, updates: Object.keys(updateData) });
      
      return review;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new AppError('Review not found', 404);
      }
      
      // Check ownership (unless admin)
      if (review.user.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to delete this review', 403);
        }
      }
      
      // Delete review
      await Review.findByIdAndDelete(reviewId);
      
      // Update venue rating
      await this.updateVenueRating(review.venue);
      
      logger.info('Review deleted', { reviewId, userId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update venue rating based on all reviews
   */
  async updateVenueRating(venueId) {
    try {
      const reviews = await Review.find({ venue: venueId });
      const totalReviews = reviews.length;
      
      if (totalReviews === 0) {
        await Venue.findByIdAndUpdate(venueId, { 
          rating: 0,
          totalReviews: 0
        });
        return;
      }
      
      const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = sumRatings / totalReviews;
      
      await Venue.findByIdAndUpdate(venueId, { 
        rating: averageRating,
        totalReviews: totalReviews
      });
      
      // Clear cache
      await cacheService.del(`venue:${venueId}`);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReviewService();
