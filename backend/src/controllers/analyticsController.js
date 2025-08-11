const catchAsync = require('../utils/catchAsync');
const analyticsService = require('../services/analyticsService');
const AppError = require('../utils/appError');

/**
 * Get booking trends analytics
 */
const getBookingTrends = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, granularity } = req.query;
  
  const trends = await analyticsService.getBookingTrends(req.user._id, { 
    dateFrom, 
    dateTo, 
    granularity 
  });
  
  res.status(200).json({
    success: true,
    data: { trends },
  });
});

/**
 * Get earnings analytics
 */
const getEarningsAnalytics = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, granularity } = req.query;
  
  const earnings = await analyticsService.getEarningsAnalytics(req.user._id, { 
    dateFrom, 
    dateTo, 
    granularity 
  });
  
  res.status(200).json({
    success: true,
    data: { earnings },
  });
});

/**
 * Get peak hours analytics
 */
const getPeakHours = catchAsync(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  
  const peakHours = await analyticsService.getPeakHours(req.user._id, { 
    dateFrom, 
    dateTo 
  });
  
  res.status(200).json({
    success: true,
    data: { peakHours },
  });
});

/**
 * Get most active sports analytics (admin only)
 */
const getMostActiveSports = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, limit } = req.query;
  
  const sports = await analyticsService.getMostActiveSports({ 
    dateFrom, 
    dateTo, 
    limit 
  });
  
  res.status(200).json({
    success: true,
    data: { sports },
  });
});

module.exports = {
  getBookingTrends,
  getEarningsAnalytics,
  getPeakHours,
  getMostActiveSports,
};
