const catchAsync = require('../utils/catchAsync');
const uploadService = require('../services/uploadService');
const AppError = require('../utils/appError');

/**
 * Upload a file
 */
const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }
  
  const { type } = req.body;
  
  const file = await uploadService.createFile(req.file, type, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: { file },
  });
});

/**
 * Get uploaded file
 */
const getFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const file = await uploadService.getFile(id);
  
  if (!file) {
    return next(new AppError('File not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: { file },
  });
});

/**
 * Delete uploaded file
 */
const deleteFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await uploadService.deleteFile(id, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
  });
});

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};
