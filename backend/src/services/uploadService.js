const Upload = require('../models/Upload');
const fs = require('fs').promises;
const path = require('path');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class UploadService {
  /**
   * Create a new file upload
   */
  async createFile(fileData, type, userId) {
    try {
      const upload = new Upload({
        filename: fileData.filename,
        originalName: fileData.originalname,
        mimeType: fileData.mimetype,
        size: fileData.size,
        type,
        uploadedBy: userId,
      });
      
      await upload.save();
      
      logger.info('File uploaded', { uploadId: upload._id, type, userId });
      
      return upload;
    } catch (error) {
      // Clean up uploaded file if save fails
      try {
        await fs.unlink(fileData.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file', { error: unlinkError.message, path: fileData.path });
      }
      
      throw error;
    }
  }

  /**
   * Get file by ID
   */
  async getFile(uploadId) {
    try {
      const upload = await Upload.findById(uploadId).lean();
      return upload;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(uploadId, userId) {
    try {
      const upload = await Upload.findById(uploadId);
      
      if (!upload) {
        throw new AppError('File not found', 404);
      }
      
      // Check ownership (unless admin)
      if (upload.uploadedBy.toString() !== userId.toString()) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user.role !== 'admin') {
          throw new AppError('Not authorized to delete this file', 403);
        }
      }
      
      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../uploads', upload.filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.error('Failed to delete file from filesystem', { error: error.message, filePath });
      }
      
      // Delete file record from database
      await Upload.findByIdAndDelete(uploadId);
      
      logger.info('File deleted', { uploadId, userId });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UploadService();
