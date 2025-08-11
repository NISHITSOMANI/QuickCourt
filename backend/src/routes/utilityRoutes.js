const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes - admin only
router.use(authenticate);

// Seed endpoint (admin only)
router.get('/seed', authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Seed endpoint accessed successfully',
  });
});

module.exports = router;
