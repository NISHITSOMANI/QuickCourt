const CircuitBreaker = require('opossum');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { logger, logBusiness } = require('../config/logger');

/**
 * Payment Service with Circuit Breaker and Retry Logic
 * This is a simulated payment service for demonstration purposes
 * In production, integrate with actual payment gateways like Razorpay, Stripe, etc.
 */
class PaymentService {
  constructor() {
    this.circuitBreaker = null;
    this.init();
  }

  /**
   * Initialize payment service with circuit breaker
   */
  init() {
    const breakerOptions = {
      timeout: config.circuitBreaker.timeout,
      errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
      resetTimeout: config.circuitBreaker.resetTimeout,
      name: 'PaymentService',
    };

    // Wrap payment processing with circuit breaker
    this.circuitBreaker = new CircuitBreaker(this.simulatePayment.bind(this), breakerOptions);

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      logger.warn('Payment service circuit breaker opened');
    });

    this.circuitBreaker.on('halfOpen', () => {
      logger.info('Payment service circuit breaker half-open');
    });

    this.circuitBreaker.on('close', () => {
      logger.info('Payment service circuit breaker closed');
    });

    logger.info('Payment service initialized successfully');
  }

  /**
   * Simulate payment processing
   * TODO: Replace with actual payment gateway integration
   */
  async simulatePayment(paymentData) {
    const { amount, method, bookingId } = paymentData;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate payment failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Payment gateway error: Transaction failed');
    }

    // Generate mock payment response
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      paymentId,
      transactionId,
      amount,
      method,
      status: 'completed',
      gateway: 'mock_gateway',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process payment with circuit breaker
   */
  async processPayment(paymentData) {
    try {
      const { bookingId, amount, method, userId } = paymentData;

      // Validate payment data
      if (!bookingId || !amount || !method || !userId) {
        throw new AppError('Missing required payment data', 400);
      }

      if (amount <= 0) {
        throw new AppError('Invalid payment amount', 400);
      }

      const validMethods = ['card', 'upi', 'wallet', 'bank_transfer'];
      if (!validMethods.includes(method)) {
        throw new AppError('Invalid payment method', 400);
      }

      // Process payment through circuit breaker
      const result = await this.circuitBreaker.fire(paymentData);

      // Log successful payment
      logBusiness('PAYMENT_PROCESSED', userId, {
        bookingId,
        paymentId: result.paymentId,
        transactionId: result.transactionId,
        amount,
        method,
        gateway: result.gateway,
      });

      // Store payment record (in production, use a Payment model)
      await this.storePaymentRecord({
        bookingId,
        paymentId: result.paymentId,
        transactionId: result.transactionId,
        amount,
        method,
        status: result.status,
        gateway: result.gateway,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Payment processing failed:', error);

      // Log failed payment attempt
      logBusiness('PAYMENT_FAILED', paymentData.userId, {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
        method: paymentData.method,
        error: error.message,
      });

      throw new AppError(`Payment failed: ${error.message}`, 400);
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundData) {
    try {
      const { bookingId, amount, reason } = refundData;

      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate refund failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Refund processing failed');
      }

      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = {
        success: true,
        refundId,
        amount,
        status: 'processed',
        reason,
        timestamp: new Date().toISOString(),
      };

      // Log successful refund
      logBusiness('REFUND_PROCESSED', null, {
        bookingId,
        refundId,
        amount,
        reason,
      });

      return result;
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw new AppError(`Refund failed: ${error.message}`, 400);
    }
  }

  /**
   * Store payment record
   * TODO: Create Payment model and store in database
   */
  async storePaymentRecord(paymentData) {
    try {
      // In production, create a Payment model and store this data
      logger.info('Payment record stored', paymentData);
      return true;
    } catch (error) {
      logger.error('Failed to store payment record:', error);
      return false;
    }
  }

  /**
   * Verify payment webhook
   */
  verifyWebhookSignature(payload, signature, secret = config.payment?.webhookSecret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new AppError('Invalid webhook signature', 401);
      }

      const webhookData = JSON.parse(payload);
      const { event, data } = webhookData;

      switch (event) {
        case 'payment.success':
          await this.handlePaymentSuccess(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailure(data);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(data);
          break;
        default:
          logger.warn('Unknown webhook event:', event);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment webhook
   */
  async handlePaymentSuccess(data) {
    const { paymentId, bookingId, amount } = data;

    // Update booking payment status
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);

    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentId = paymentId;
      booking.status = 'confirmed';
      await booking.save();

      logBusiness('PAYMENT_WEBHOOK_SUCCESS', booking.user, {
        bookingId,
        paymentId,
        amount,
      });
    }
  }

  /**
   * Handle failed payment webhook
   */
  async handlePaymentFailure(data) {
    const { paymentId, bookingId, reason } = data;

    // Update booking payment status
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);

    if (booking) {
      booking.paymentStatus = 'failed';
      booking.paymentId = paymentId;
      await booking.save();

      logBusiness('PAYMENT_WEBHOOK_FAILURE', booking.user, {
        bookingId,
        paymentId,
        reason,
      });
    }
  }

  /**
   * Handle refund processed webhook
   */
  async handleRefundProcessed(data) {
    const { refundId, bookingId, amount } = data;

    // Update booking refund status
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);

    if (booking) {
      booking.paymentStatus = 'refunded';
      booking.refundAmount = amount;
      await booking.save();

      logBusiness('REFUND_WEBHOOK_PROCESSED', booking.user, {
        bookingId,
        refundId,
        amount,
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      // In production, query the payment gateway API
      // For now, return mock status
      return {
        paymentId,
        status: 'completed',
        amount: 1000,
        method: 'card',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      throw new AppError('Failed to retrieve payment status', 500);
    }
  }

  /**
   * Get payment methods
   */
  getPaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay using your credit or debit card',
        enabled: true,
      },
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay using UPI apps like GPay, PhonePe, Paytm',
        enabled: true,
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Pay using digital wallets',
        enabled: true,
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        enabled: false,
      },
      {
        id: 'cash',
        name: 'Cash on Arrival',
        description: 'Pay cash when you arrive at the venue',
        enabled: true,
      },
    ];
  }

  /**
   * Health check for payment service
   */
  async healthCheck() {
    try {
      // Test circuit breaker status
      const circuitBreakerStats = this.circuitBreaker.stats;

      return {
        status: 'healthy',
        circuitBreaker: {
          state: this.circuitBreaker.opened ? 'open' : 'closed',
          stats: circuitBreakerStats,
        },
        paymentMethods: this.getPaymentMethods().filter(method => method.enabled).length,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentService();
