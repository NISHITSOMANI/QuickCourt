const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize, venueOwnerOrAdmin } = require('../middleware/authMiddleware');
const { validateBody, validateQuery, validateParams, validateTimeRange, validateBookingDate } = require('../middleware/validateRequest');

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.post('/',
  authorize('user'),
  validateBody('bookingCreate'),
  validateTimeRange,
  validateBookingDate,
  bookingController.createBooking
);

router.get('/my',
  authorize('user'),
  validateQuery('paginationQuery'),
  bookingController.getMyBookings
);

router.get('/:id',
  validateParams('mongoId'),
  bookingController.getBookingById
);

router.put('/:id/cancel',
  authorize('user'),
  validateParams('mongoId'),
  bookingController.cancelBooking
);

// Owner/Admin routes
router.post('/:id/confirm',
  authorize('owner', 'admin'),
  validateParams('mongoId'),
  bookingController.confirmBooking
);

router.get('/venue/:venueId',
  authorize('owner', 'admin'),
  validateParams('mongoId'),
  validateQuery('paginationQuery'),
  bookingController.getVenueBookings
);

router.put('/:id/status',
  authorize('owner', 'admin'),
  validateParams('mongoId'),
  bookingController.updateBookingStatus
);

// Admin only routes
router.get('/all',
  authorize('admin'),
  validateQuery('paginationQuery'),
  bookingController.getAllBookings
);

module.exports = router;
