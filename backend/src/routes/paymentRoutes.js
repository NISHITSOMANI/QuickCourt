const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, validateParams } = require('../middleware/validateRequest');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Simulate payment (for testing)
router.post('/simulate',
  validateBody('paymentSimulation'),
  paymentController.simulatePayment
);

// Webhook endpoint (no auth required)
router.post('/webhook', paymentController.handlePaymentWebhook);

// Get payment by booking ID
router.get('/booking/:bookingId',
  validateParams('mongoId'),
  paymentController.getPaymentByBooking
);

// Get payments for owner
router.get('/owner/:ownerId',
  validateParams('mongoId'),
  authorize('owner'),
  paymentController.getPaymentsByOwner
);

module.exports = router;
