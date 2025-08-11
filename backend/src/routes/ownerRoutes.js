const express = require('express');
const ownerController = require('../controllers/ownerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateQuery, validateParams, validateBody } = require('../middleware/validateRequest');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Protected routes - owner only
router.use(authenticate);
router.use(authorize('owner'));

// Owner stats
router.get('/stats',
  validateQuery('ownerStatsQuery'),
  ownerController.getOwnerStats
);

// Owner venues
router.get('/venues',
  validateQuery('pagination'),
  ownerController.getOwnerVenues
);

// Venue bookings
router.get('/venues/:id/bookings',
  validateParams('mongoId'),
  validateQuery('venueBookingsQuery'),
  ownerController.getVenueBookings
);

// Add court to venue
router.post('/venues/:id/courts',
  validateParams('mongoId'),
  validateBody('courtCreate'),
  ownerController.addCourtToVenue
);

// Update court
router.put('/courts/:id',
  validateParams('mongoId'),
  validateBody('courtUpdate'),
  ownerController.updateCourt
);

// Owner transactions
router.get('/transactions',
  validateQuery('dateRange'),
  ownerController.getOwnerTransactions
);

module.exports = router;
