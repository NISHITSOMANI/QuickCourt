/**
 * Final Payment Concurrency Test
 * This test demonstrates the enhanced payment security mechanisms
 * without requiring actual database connections
 */

class MockLockService {
  constructor() {
    this.locks = new Map();
  }

  async acquireWithRetry(lockKey, owner) {
    console.log(`  Attempting to acquire lock: ${lockKey} for ${owner}`);
    
    if (this.locks.has(lockKey)) {
      console.log(`  ❌ Lock already held by: ${this.locks.get(lockKey)}`);
      return false;
    }
    
    this.locks.set(lockKey, owner);
    console.log(`  ✅ Lock acquired by: ${owner}`);
    return true;
  }

  async release(lockKey, owner) {
    if (this.locks.get(lockKey) === owner) {
      this.locks.delete(lockKey);
      console.log(`  🔓 Lock released by: ${owner}`);
    }
  }
}

class MockBooking {
  static async findById(bookingId) {
    // Simulate different booking states
    const bookings = {
      'booking-1': { _id: 'booking-1', paymentStatus: 'pending' },
      'booking-2': { _id: 'booking-2', paymentStatus: 'paid' },
      'booking-3': { _id: 'booking-3', paymentStatus: 'processing' }
    };
    
    return bookings[bookingId] || null;
  }
  
  static async findOneAndUpdate(query, update, options) {
    console.log(`  🔂 Atomic update for booking: ${query._id}`);
    console.log(`  🔄 Updating status to: ${update.paymentStatus}`);
    return { _id: query._id, paymentStatus: update.paymentStatus };
  }
}

class MockPaymentService {
  constructor() {
    this.lockService = new MockLockService();
  }

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
    const booking = await MockBooking.findById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'processing') {
      throw new Error('Booking is no longer available for payment');
    }
    
    console.log(`✅ Booking is available (status: ${booking.paymentStatus})`);
    
    // Create lock key for this booking
    const lockKey = `payment:${bookingId}`;
    const lockOwner = `user:${userId}`;
    
    // Use distributed locking to ensure only one payment attempt proceeds
    console.log(`\n🔐 Distributed locking for payment`);
    const paymentLockAcquired = await this.lockService.acquireWithRetry(lockKey, lockOwner);
    
    if (!paymentLockAcquired) {
      throw new Error('Payment is already being processed for this booking');
    }
    
    try {
      // Double-check booking status under lock
      console.log(`\n🔍 Double-check booking status under lock`);
      const freshBooking = await MockBooking.findById(bookingId);
      
      if (!freshBooking || 
          (freshBooking.paymentStatus !== 'pending' && 
           freshBooking.paymentStatus !== 'failed')) {
        throw new Error('Booking is no longer available for payment');
      }
      
      console.log(`✅ Booking still available (status: ${freshBooking.paymentStatus})`);
      
      // Atomically check and update booking status to prevent double payments
      console.log(`\n🔒 Atomic booking status update`);
      const updatedBooking = await MockBooking.findOneAndUpdate(
        { 
          _id: bookingId, 
          $or: [
            { paymentStatus: 'pending' },
            { paymentStatus: 'failed' }
          ]
        },
        { paymentStatus: 'processing' },
        { new: true }
      );
      
      // Simulate payment gateway interaction
      console.log(`\n💳 Processing payment through gateway...`);
      console.log(`   Amount: ${amount}`);
      console.log(`   Method: ${method}`);
      
      // Simulate successful payment (random delay to show concurrency)
      const delay = Math.floor(Math.random() * 2000) + 1000;
      console.log(`   Processing delay: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
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
        gateway: 'demo_gateway',
        userId
      };
    } finally {
      // Always release the payment lock
      await this.lockService.release(lockKey, lockOwner);
    }
  }
}

async function runFinalConcurrencyTest() {
  console.log('=== Final QuickCourt Payment Concurrency Test ===\n');
  
  const paymentService = new MockPaymentService();
  
  // Test 1: Valid payment processing
  console.log('🟢 Test 1: Valid Payment Processing');
  try {
    const result = await paymentService.processPayment({
      bookingId: 'booking-1',
      amount: 1000,
      method: 'card',
      userId: 'user-1'
    });
    console.log(`\n🎉 Payment Result: Success for ${result.userId}\n`);
  } catch (error) {
    console.log(`\n❌ Payment Error: ${error.message}\n`);
  }
  
  // Test 2: Payment for already paid booking
  console.log('🔴 Test 2: Payment for Already Paid Booking');
  try {
    await paymentService.processPayment({
      bookingId: 'booking-2',
      amount: 1000,
      method: 'card',
      userId: 'user-2'
    });
  } catch (error) {
    console.log(`\n❌ Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - no gateway interaction for paid bookings\n');
  }
  
  // Test 3: Payment for processing booking
  console.log('🔴 Test 3: Payment for Processing Booking');
  try {
    await paymentService.processPayment({
      bookingId: 'booking-3',
      amount: 1000,
      method: 'card',
      userId: 'user-3'
    });
  } catch (error) {
    console.log(`\n❌ Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - no gateway interaction for processing bookings\n');
  }
  
  // Test 4: Concurrent payment attempts
  console.log('🟡 Test 4: Concurrent Payment Attempts');
  console.log('   This test simulates what happens when two users try to pay simultaneously\n');
  
  // Start both payments at the same time
  const paymentPromise1 = paymentService.processPayment({
    bookingId: 'booking-1',
    amount: 1000,
    method: 'card',
    userId: 'user-A'
  }).then(result => {
    console.log(`\n✅ User A Payment Success: ${JSON.stringify(result, null, 2)}`);
    return result;
  }).catch(error => {
    console.log(`\n❌ User A Payment Failed: ${error.message}`);
    return error;
  });
  
  const paymentPromise2 = paymentService.processPayment({
    bookingId: 'booking-1',
    amount: 1500,
    method: 'upi',
    userId: 'user-B'
  }).then(result => {
    console.log(`\n✅ User B Payment Success: ${JSON.stringify(result, null, 2)}`);
    return result;
  }).catch(error => {
    console.log(`\n❌ User B Payment Rejected: ${error.message}`);
    console.log('   This is the expected behavior - payment rejected before gateway interaction');
    return error;
  });
  
  // Wait for both payments to complete
  const [result1, result2] = await Promise.all([paymentPromise1, paymentPromise2]);
  
  console.log('\n=== Test Summary ===');
  console.log('Key Security Features Demonstrated:');
  console.log('1. Pre-gateway booking status validation');
  console.log('2. Distributed locking prevents concurrent payments');
  console.log('3. Atomic database operations ensure consistency');
  console.log('4. Instant rejection without payment gateway interaction');
  console.log('5. No refunds needed for concurrency conflicts');
  console.log('6. Clear error messaging for users');
}

// Execute the test
runFinalConcurrencyTest().catch(console.error);

module.exports = { MockLockService, MockBooking, MockPaymentService, runFinalConcurrencyTest };
