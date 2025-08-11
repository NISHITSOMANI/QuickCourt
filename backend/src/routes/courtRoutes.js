const express = require('express');
const courtController = require('../controllers/courtController');
const { authenticate, authorize, venueOwnerOrAdmin } = require('../middleware/authMiddleware');
const { validateBody, validateQuery, validateParams } = require('../middleware/validateRequest');

const router = express.Router();

// Public routes
router.get('/venues/:venueId/courts', 
  validateParams('mongoId'),
  courtController.getCourtsByVenue
);

router.get('/:id', 
  validateParams('mongoId'),
  courtController.getCourtById
);

router.get('/:id/availability',
  validateParams('mongoId'),
  validateQuery('date'),
  courtController.getCourtAvailability
);

// Protected routes
router.use(authenticate);

// Owner routes
router.post('/venues/:venueId/courts',
  authorize('owner'),
  validateParams('mongoId'),
  validateBody('courtCreate'),
  courtController.createCourt
);

router.put('/:id',
  validateParams('mongoId'),
  venueOwnerOrAdmin,
  courtController.updateCourt
);

router.delete('/:id',
  validateParams('mongoId'),
  venueOwnerOrAdmin,
  courtController.deleteCourt
);

router.post('/:id/block',
  validateParams('mongoId'),
  authorize('owner'),
  validateBody('courtBlockSlot'),
  courtController.blockCourtSlot
);

router.post('/:id/unblock',
  validateParams('mongoId'),
  authorize('owner'),
  validateBody('courtUnblockSlot'),
  courtController.unblockCourtSlot
);

module.exports = router;
