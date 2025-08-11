const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validateRequest');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Booking trends
router.get('/bookings/trends',
  authorize(['owner', 'admin']),
  validateQuery('analyticsQuery'),
  analyticsController.getBookingTrends
);

// Earnings analytics
router.get('/earnings',
  authorize(['owner', 'admin']),
  validateQuery('analyticsQuery'),
  analyticsController.getEarningsAnalytics
);

// Peak hours
router.get('/peak-hours',
  authorize(['owner', 'admin']),
  validateQuery('dateRange'),
  analyticsController.getPeakHours
);

// Most active sports (admin only)
router.get('/most-active-sports',
  authorize('admin'),
  validateQuery('dateRange'),
  analyticsController.getMostActiveSports
);

module.exports = router;
