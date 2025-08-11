const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateQuery, validateParams } = require('../middleware/validateRequest');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Admin statistics
router.get('/stats',
  validateQuery('dateRange'),
  adminController.getAdminStats
);

// Facility management
router.get('/facilities/pending',
  validateQuery('paginationQuery'),
  adminController.getPendingFacilities
);

router.get('/facilities/:id',
  validateParams('mongoId'),
  adminController.getFacilityDetails
);

router.patch('/facilities/:id/approve',
  validateParams('mongoId'),
  adminController.approveFacility
);

router.patch('/facilities/:id/reject',
  validateParams('mongoId'),
  adminController.rejectFacility
);

// User management
router.get('/users',
  validateQuery('paginationQuery'),
  adminController.getUsers
);

router.patch('/users/:id/ban',
  validateParams('mongoId'),
  adminController.banUser
);

router.patch('/users/:id/unban',
  validateParams('mongoId'),
  adminController.unbanUser
);

// Reports management
router.get('/reports',
  validateQuery('paginationQuery'),
  adminController.getReports
);

router.post('/reports/:id/action',
  validateParams('mongoId'),
  adminController.takeReportAction
);

module.exports = router;
