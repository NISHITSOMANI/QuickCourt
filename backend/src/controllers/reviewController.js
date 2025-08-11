const catchAsync = require('../utils/catchAsync');
const reviewService = require('../services/reviewService');
const AppError = require('../utils/appError');

/**
 * Get reviews for a venue
 */
const getReviewsByVenue = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const { page, limit, sort } = req.query;
  
  const reviews = await reviewService.getReviewsByVenue(venueId, { page, limit, sort });
  
  res.status(200).json({
    success: true,
    data: { reviews },
  });
});

/**
 * Create a new review
 */
const createReview = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const reviewData = req.body;
  
  const review = await reviewService.createReview(venueId, reviewData, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review },
  });
});

/**
 * Update review
 */
const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const review = await reviewService.updateReview(id, updateData, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: { review },
  });
});

/**
 * Delete review
 */
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await reviewService.deleteReview(id, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

module.exports = {
  getReviewsByVenue,
  createReview,
  updateReview,
  deleteReview,
};
