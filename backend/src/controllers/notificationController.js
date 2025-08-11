const catchAsync = require('../utils/catchAsync');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/appError');

/**
 * Get user notifications
 */
const getNotifications = catchAsync(async (req, res) => {
  const { page, limit, unread } = req.query;
  
  const notifications = await notificationService.getNotifications(req.user._id, { page, limit, unread });
  
  res.status(200).json({
    success: true,
    data: { notifications },
  });
});

/**
 * Create a new notification
 */
const createNotification = catchAsync(async (req, res) => {
  const notificationData = req.body;
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: { notification },
  });
});

/**
 * Mark notification as read
 */
const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const notification = await notificationService.markAsRead(id, req.user._id);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

/**
 * Delete notification
 */
const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await notificationService.deleteNotification(id, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
};
