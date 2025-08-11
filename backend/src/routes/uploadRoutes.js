const express = require('express');
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { validateParams } = require('../middleware/validateRequest');

const router = express.Router();

// Protected routes
router.use(authenticate);

// Upload file (owner/admin only)
router.post('/',
  authorize(['owner', 'admin']),
  upload.single('file'),
  uploadController.uploadFile
);

// Get uploaded file (public)
router.get('/:id',
  validateParams('mongoId'),
  uploadController.getFile
);

// Delete uploaded file (owner/admin only)
router.delete('/:id',
  validateParams('mongoId'),
  authorize(['owner', 'admin']),
  uploadController.deleteFile
);

module.exports = router;
