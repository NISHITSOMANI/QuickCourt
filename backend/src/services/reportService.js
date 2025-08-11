const Report = require('../models/Report');
const User = require('../models/User');
const Venue = require('../models/Venue');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class ReportService {
  /**
   * Create a new report
   */
  async createReport(reportData, userId) {
    try {
      const { type, targetId, reason, details } = reportData;
      
      // Validate target exists based on type
      let targetExists = false;
      switch (type) {
        case 'venue':
          targetExists = await Venue.exists({ _id: targetId });
          break;
        case 'user':
          targetExists = await User.exists({ _id: targetId });
          break;
        case 'review':
          const Review = require('../models/Review');
          targetExists = await Review.exists({ _id: targetId });
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }
      
      if (!targetExists) {
        throw new AppError('Target not found', 404);
      }
      
      // Create report
      const report = new Report({
        type,
        targetId,
        reason,
        details,
        reportedBy: userId,
      });
      
      await report.save();
      
      logger.info('Report created', { reportId: report._id, type, targetId, userId });
      
      return report;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get reports for a user
   */
  async getUserReports(userId, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      
      const reports = await Report.find({ reportedBy: userId })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
        
      return reports;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all reports (admin only)
   */
  async getReports(options = {}) {
    try {
      const { status, type, page, limit } = options;
      
      const query = {};
      if (status) query.status = status;
      if (type) query.type = type;
      
      const reports = await Report.find(query)
        .sort('-createdAt')
        .skip((parseInt(page) || 1 - 1) * (parseInt(limit) || 10))
        .limit(parseInt(limit) || 10)
        .populate('reportedBy', 'name email')
        .lean();
        
      return reports;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update report status (admin only)
   */
  async updateReport(reportId, updateData, adminId) {
    try {
      const report = await Report.findById(reportId);
      
      if (!report) {
        throw new AppError('Report not found', 404);
      }
      
      // Update report
      Object.assign(report, updateData);
      report.resolvedBy = adminId;
      report.resolvedAt = new Date();
      
      await report.save();
      
      logger.info('Report updated', { reportId, adminId, updates: Object.keys(updateData) });
      
      return report;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReportService();
