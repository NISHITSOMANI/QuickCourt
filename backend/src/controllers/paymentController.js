const catchAsync = require('../utils/catchAsync');
const paymentService = require('../services/paymentService');
const AppError = require('../utils/appError');

/**
 * Simulate a payment (for testing purposes)
 */
const simulatePayment = catchAsync(async (req, res) => {
  const { bookingId, amount, method } = req.body;
  
  const payment = await paymentService.simulatePayment(bookingId, amount, method, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Payment simulated successfully',
    data: { payment },
  });
});

/**
 * Handle payment webhook from payment provider
 */
const handlePaymentWebhook = catchAsync(async (req, res) => {
  const payload = req.body;
  
  await paymentService.handlePaymentWebhook(payload);
  
  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
  });
});

/**
 * Get payment by booking ID
 */
const getPaymentByBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  const payment = await paymentService.getPaymentByBooking(bookingId, req.user._id);
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: { payment },
  });
});

/**
 * Get payments for owner
 */
const getPaymentsByOwner = catchAsync(async (req, res) => {
  const { ownerId } = req.params;
  
  // Verify ownership
  if (ownerId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to view these payments', 403));
  }
  
  const payments = await paymentService.getPaymentsByOwner(ownerId);
  
  res.status(200).json({
    success: true,
    data: { payments },
  });
});

module.exports = {
  simulatePayment,
  handlePaymentWebhook,
  getPaymentByBooking,
  getPaymentsByOwner,
};
