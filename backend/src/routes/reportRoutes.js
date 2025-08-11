const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middleware/validateRequest');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Create a new report
router.post('/',
  validateBody('reportCreate'),
  reportController.createReport
);

// Get user's reports
router.get('/my',
  validateQuery('pagination'),
  reportController.getUserReports
);

// Admin routes
router.get('/',
  authorize('admin'),
  validateQuery('reportQuery'),
  reportController.getReports
);

router.put('/:id',
  authorize('admin'),
  validateParams('mongoId'),
  validateBody('reportUpdate'),
  reportController.updateReport
);

module.exports = router;
