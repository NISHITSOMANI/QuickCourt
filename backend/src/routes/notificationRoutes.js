const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middleware/validateRequest');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Get user notifications
router.get('/',
  validateQuery('pagination'),
  notificationController.getNotifications
);

// Create notification (admin or system only)
router.post('/',
  authorize(['admin', 'system']),
  validateBody('notificationCreate'),
  notificationController.createNotification
);

// Mark notification as read
router.put('/:id/read',
  validateParams('mongoId'),
  notificationController.markAsRead
);

// Delete notification
router.delete('/:id',
  validateParams('mongoId'),
  notificationController.deleteNotification
);

module.exports = router;
