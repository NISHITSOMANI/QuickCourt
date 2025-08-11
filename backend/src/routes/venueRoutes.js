const express = require('express');
const venueController = require('../controllers/venueController');
const { authenticate, authorize, optionalAuth, venueOwnerOrAdmin } = require('../middleware/authMiddleware');
const { validateBody, validateQuery, validateParams } = require('../middleware/validateRequest');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', 
  validateQuery('venueQuery'),
  venueController.getVenues
);

router.get('/popular',
  venueController.getPopularVenues
);

router.get('/:id',
  validateParams('mongoId'),
  venueController.getVenueById
);

router.get('/:id/gallery',
  validateParams('mongoId'),
  venueController.getVenueGallery
);

router.get('/:id/availability',
  validateParams('mongoId'),
  venueController.getVenueAvailability
);

router.get('/:id/reviews',
  validateParams('mongoId'),
  validateQuery('paginationQuery'),
  venueController.getVenueReviews
);

// Protected routes
router.use(authenticate);

// Owner routes
router.post('/',
  authorize('owner', 'admin'),
  validateBody('venueCreate'),
  venueController.createVenue
);

router.put('/:id',
  validateParams('mongoId'),
  validateBody('venueUpdate'),
  venueOwnerOrAdmin,
  venueController.updateVenue
);

router.delete('/:id',
  validateParams('mongoId'),
  venueOwnerOrAdmin,
  venueController.deleteVenue
);

router.post('/:id/photos',
  validateParams('mongoId'),
  venueOwnerOrAdmin,
  uploadMultiple('photos', 5),
  venueController.addPhotos
);

router.delete('/:id/photos/:photoId',
  validateParams('mongoId'),
  venueOwnerOrAdmin,
  venueController.deletePhoto
);

module.exports = router;
