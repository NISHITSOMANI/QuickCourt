const express = require('express');
const authRoutes = require('./authRoutes');
const venueRoutes = require('./venueRoutes');
const bookingRoutes = require('./bookingRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');
const courtRoutes = require('./courtRoutes');
const timeslotRoutes = require('./timeslotRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reportRoutes = require('./reportRoutes');
const uploadRoutes = require('./uploadRoutes');
const ownerRoutes = require('./ownerRoutes');
const utilityRoutes = require('./utilityRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const db = require('../config/db');
    const dbStatus = await db.healthCheck();
    
    // Check cache service
    const cache = require('../config/cache');
    const cacheStatus = cache.healthCheck();
    
    // Get service statuses
    const notificationService = require('../services/notificationService');
    const bookingService = require('../services/bookingService');
    const paymentService = require('../services/paymentService');
    const emailService = require('../services/emailService');
    
    const [notificationStatus, bookingStatus, paymentStatus, emailStatus] = await Promise.all([
      notificationService.getHealthStatus(),
      bookingService.getHealthStatus(),
      paymentService.healthCheck(),
      emailService.healthCheck()
    ]);
    
    const allServicesHealthy = [
      dbStatus.status === 'healthy',
      cacheStatus.status === 'healthy',
      notificationStatus.status === 'ok' && !notificationStatus.degraded,
      bookingStatus.status === 'ok' && !bookingStatus.degraded,
      paymentStatus.status === 'healthy',
      emailStatus.status === 'healthy'
    ].every(Boolean);
    
    const status = allServicesHealthy ? 200 : 503;
    
    res.status(status).json({
      success: allServicesHealthy,
      message: allServicesHealthy ? 'All systems operational' : 'One or more services are degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
        cache: cacheStatus,
        notification: notificationStatus,
        booking: bookingStatus,
        payment: paymentStatus,
        email: emailStatus
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
router.use('/auth', authRoutes);
router.use('/venues', venueRoutes);
router.use('/bookings', bookingRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/courts', courtRoutes);
router.use('/timeslots', timeslotRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/uploads', uploadRoutes);
router.use('/owner', ownerRoutes);
router.use('/utility', utilityRoutes);

module.exports = router;
