import api from './config';
import { toast } from 'react-hot-toast';

/**
 * Payment API service for handling payment operations
 */
export const paymentApi = {
  /**
   * Create payment intent for booking
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} - Payment intent data
   */
  createPaymentIntent: async (paymentData) => {
    try {
      const response = await api.post('/payments/create-intent', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment');
      throw error;
    }
  },

  /**
   * Confirm payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {Object} paymentMethod - Payment method details
   * @returns {Promise<Object>} - Payment confirmation
   */
  confirmPayment: async (paymentIntentId, paymentMethod) => {
    try {
      const response = await api.post('/payments/confirm', {
        paymentIntentId,
        paymentMethod
      });
      toast.success('Payment successful!');
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Payment failed. Please try again.');
      throw error;
    }
  },

  /**
   * Get payment history for user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Payment history
   */
  getPaymentHistory: async (params = {}) => {
    try {
      const response = await api.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to fetch payment history');
      throw error;
    }
  },

  /**
   * Process refund
   * @param {string} paymentId - Payment ID
   * @param {number} amount - Refund amount
   * @returns {Promise<Object>} - Refund details
   */
  processRefund: async (paymentId, amount) => {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, { amount });
      toast.success('Refund processed successfully');
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
      throw error;
    }
  }
};

export default paymentApi;
