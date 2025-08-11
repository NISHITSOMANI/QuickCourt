const catchAsync = require('../utils/catchAsync');
const reportService = require('../services/reportService');
const AppError = require('../utils/appError');

/**
 * Create a new report
 */
const createReport = catchAsync(async (req, res) => {
  const reportData = req.body;
  
  const report = await reportService.createReport(reportData, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: { report },
  });
});

/**
 * Get user's reports
 */
const getUserReports = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  
  const reports = await reportService.getUserReports(req.user._id, { page, limit });
  
  res.status(200).json({
    success: true,
    data: { reports },
  });
});

/**
 * Get all reports (admin only)
 */
const getReports = catchAsync(async (req, res) => {
  const { status, type, page, limit } = req.query;
  
  const reports = await reportService.getReports({ status, type, page, limit });
  
  res.status(200).json({
    success: true,
    data: { reports },
  });
});

/**
 * Update report status (admin only)
 */
const updateReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const report = await reportService.updateReport(id, updateData, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: { report },
  });
});

module.exports = {
  createReport,
  getUserReports,
  getReports,
  updateReport,
};
