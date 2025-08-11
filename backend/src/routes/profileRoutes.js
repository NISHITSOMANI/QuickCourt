const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateQuery } = require('../middleware/validateRequest');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Common profile routes
router.get('/', profileController.getProfile);
router.put('/', 
  validateBody('userUpdate'),
  profileController.updateProfile
);

router.get('/bookings',
  validateQuery('paginationQuery'),
  profileController.getProfileBookings
);

// Owner-specific routes
router.get('/earnings',
  authorize('owner'),
  validateQuery('dateRange'),
  profileController.getEarnings
);

router.get('/stats',
  authorize('owner'),
  profileController.getOwnerStats
);

module.exports = router;
