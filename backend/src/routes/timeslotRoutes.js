const express = require('express');
const timeslotController = require('../controllers/timeslotController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateQuery, validateParams } = require('../middleware/validateRequest');

const router = express.Router();

// Public routes
router.get('/venue/:venueId', 
  validateParams('mongoId'),
  validateQuery('date'),
  timeslotController.getTimeslotsByVenue
);

// Protected routes
router.use(authenticate);

router.post('/venue/:venueId',
  authorize('owner'),
  validateParams('mongoId'),
  validateBody('timeslotCreate'),
  timeslotController.createTimeslot
);

router.put('/:id',
  authorize('owner'),
  validateParams('mongoId'),
  validateBody('timeslotUpdate'),
  timeslotController.updateTimeslot
);

router.delete('/:id',
  authorize('owner'),
  validateParams('mongoId'),
  timeslotController.deleteTimeslot
);

module.exports = router;
