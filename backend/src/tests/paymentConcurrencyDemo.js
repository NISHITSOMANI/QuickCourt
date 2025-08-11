/**
 * Payment Concurrency Demo Test
 * This test demonstrates the enhanced payment security mechanisms
 * without requiring actual database connections or court data
 */

// Simulate the payment service logic without database calls
class PaymentConcurrencyDemo {
  constructor() {
    this.locks = new Map(); // In-memory lock storage for demo
  }

  // Simulate distributed lock service
  async acquireLock(lockKey, owner) {
    console.log(`Attempting to acquire lock: ${lockKey} for ${owner}`);
    
    if (this.locks.has(lockKey)) {
      console.log(`❌ Lock already held by: ${this.locks.get(lockKey)}`);
      return false; // Lock already held
    }
    
    this.locks.set(lockKey, owner);
    console.log(`✅ Lock acquired by: ${owner}`);
    return true;
  }

  async releaseLock(lockKey, owner) {
    if (this.locks.get(lockKey) === owner) {
      this.locks.delete(lockKey);
      console.log(`🔓 Lock released by: ${owner}`);
    }
  }

  // Simulate booking status check
  checkBookingStatus(bookingId, expectedStatus) {
    // In a real implementation, this would check the database
    // For demo purposes, we'll simulate different scenarios
    const statuses = {
      'already-paid-booking': 'paid',
      'pending-booking': 'pending',
      'processing-booking': 'processing',
      'failed-booking': 'failed',
      'non-existent-booking': null
    };
    
    return statuses[bookingId] || 'pending';
  }

  // Simulate the enhanced payment processing logic
  async processPayment(paymentData) {
    const { bookingId, amount, method, userId } = paymentData;
    
    // Validate payment data
    if (!bookingId || !amount || !method || !userId) {
      throw new Error('Missing required payment data');
    }
    
    if (amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    const validMethods = ['card', 'upi', 'wallet', 'bank_transfer'];
    if (!validMethods.includes(method)) {
      throw new Error('Invalid payment method');
    }
    
    // Pre-gateway validation: Check if booking exists and is still available
    console.log(`\n🔍 Pre-gateway validation for booking: ${bookingId}`);
    const bookingStatus = this.checkBookingStatus(bookingId, ['pending', 'failed']);
    
    if (!bookingStatus) {
      throw new Error('Booking not found');
    }
    
    if (bookingStatus === 'paid' || bookingStatus === 'processing') {
      throw new Error('Booking is no longer available for payment');
    }
    
    console.log(`✅ Booking is available (status: ${bookingStatus})`);
    
    // Create lock key for this booking
    const lockKey = `payment:${bookingId}`;
    const lockOwner = `user:${userId}:${Date.now()}`;
    
    // Use distributed locking to ensure only one payment attempt proceeds
    console.log(`\n🔐 Distributed locking for payment`);
    const paymentLockAcquired = await this.acquireLock(lockKey, lockOwner);
    
    if (!paymentLockAcquired) {
      throw new Error('Payment is already being processed for this booking');
    }
    
    try {
      // Double-check booking status under lock
      console.log(`\n🔍 Double-check booking status under lock`);
      const freshBookingStatus = this.checkBookingStatus(bookingId, ['pending', 'failed']);
      
      if (!freshBookingStatus || 
          (freshBookingStatus !== 'pending' && 
           freshBookingStatus !== 'failed')) {
        throw new Error('Booking is no longer available for payment');
      }
      
      console.log(`✅ Booking still available (status: ${freshBookingStatus})`);
      
      // Simulate payment gateway interaction
      console.log(`\n💳 Processing payment through gateway...`);
      console.log(`   Amount: ${amount}`);
      console.log(`   Method: ${method}`);
      
      // Simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Payment processed successfully`);
      
      // Simulate storing payment record
      console.log(`\n💾 Storing payment record...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`✅ Payment record stored`);
      
      return {
        success: true,
        paymentId: `payment_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        status: 'success',
        gateway: 'demo_gateway'
      };
    } finally {
      // Always release the payment lock
      await this.releaseLock(lockKey, lockOwner);
    }
  }
}

// Run the concurrency demo
async function runPaymentConcurrencyDemo() {
  console.log('=== QuickCourt Payment Concurrency Demo ===\n');
  
  const demo = new PaymentConcurrencyDemo();
  
  // Test 1: Valid payment processing
  console.log('🟢 Test 1: Valid Payment Processing');
  try {
    const result = await demo.processPayment({
      bookingId: 'pending-booking',
      amount: 1000,
      method: 'card',
      userId: 'user-1'
    });
    console.log(`\n🎉 Payment Result: ${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.log(`\n❌ Payment Error: ${error.message}\n`);
  }
  
  // Test 2: Concurrent payment attempts
  console.log('🟡 Test 2: Concurrent Payment Attempts');
  console.log('\n--- First User Attempt ---');
  const payment1 = demo.processPayment({
    bookingId: 'pending-booking',
    amount: 1000,
    method: 'card',
    userId: 'user-1'
  });
  
  console.log('\n--- Second User Attempt (should be rejected) ---');
  const payment2 = demo.processPayment({
    bookingId: 'pending-booking',
    amount: 1000,
    method: 'upi',
    userId: 'user-2'
  });
  
  try {
    const result1 = await payment1;
    console.log(`\n✅ First User Payment Success: ${JSON.stringify(result1, null, 2)}`);
  } catch (error) {
    console.log(`\n❌ First User Payment Error: ${error.message}`);
  }
  
  try {
    const result2 = await payment2;
    console.log(`\n✅ Second User Payment Success: ${JSON.stringify(result2, null, 2)}`);
  } catch (error) {
    console.log(`\n❌ Second User Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - payment rejected before gateway interaction');
  }
  
  // Test 3: Payment for already paid booking
  console.log('\n🔴 Test 3: Payment for Already Paid Booking');
  try {
    await demo.processPayment({
      bookingId: 'already-paid-booking',
      amount: 1000,
      method: 'card',
      userId: 'user-3'
    });
  } catch (error) {
    console.log(`\n❌ Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - no gateway interaction for paid bookings');
  }
  
  // Test 4: Invalid payment data
  console.log('\n🔴 Test 4: Invalid Payment Data');
  try {
    await demo.processPayment({
      amount: -100,
      method: 'invalid',
      userId: 'user-4'
    });
  } catch (error) {
    console.log(`\n❌ Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - data validation prevents gateway interaction');
  }
  
  console.log('\n=== Demo Summary ===');
  console.log('Key Security Features Implemented:');
  console.log('1. Pre-gateway booking status validation');
  console.log('2. Distributed locking prevents concurrent payments');
  console.log('3. Instant rejection without payment gateway interaction');
  console.log('4. No refunds needed for concurrency conflicts');
  console.log('5. Atomic database operations ensure consistency');
}

// Execute the demo
runPaymentConcurrencyDemo().catch(console.error);

module.exports = { PaymentConcurrencyDemo, runPaymentConcurrencyDemo };
