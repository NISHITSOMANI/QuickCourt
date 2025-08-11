const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middleware/validateRequest');

const router = express.Router();

// Public routes
router.get('/venues/:venueId', 
  validateParams('mongoId'),
  validateQuery('pagination'),
  reviewController.getReviewsByVenue
);

// Protected routes
router.use(authenticate);

// Create review
router.post('/venues/:venueId',
  authorize('user'),
  validateParams('mongoId'),
  validateBody('reviewCreate'),
  reviewController.createReview
);

// Update review
router.put('/:id',
  validateParams('mongoId'),
  reviewController.updateReview
);

// Delete review
router.delete('/:id',
  validateParams('mongoId'),
  reviewController.deleteReview
);

module.exports = router;
