const catchAsync = require('../utils/catchAsync');
const ownerService = require('../services/ownerService');
const AppError = require('../utils/appError');

/**
 * Get owner stats
 */
const getOwnerStats = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, granularity } = req.query;
  
  const stats = await ownerService.getOwnerStats(req.user._id, { 
    dateFrom, 
    dateTo, 
    granularity 
  });
  
  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * Get owner venues
 */
const getOwnerVenues = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  
  const venues = await ownerService.getOwnerVenues(req.user._id, { page, limit });
  
  res.status(200).json({
    success: true,
    data: { venues },
  });
});

/**
 * Get venue bookings
 */
const getVenueBookings = catchAsync(async (req, res) => {
  const { id: venueId } = req.params;
  const { status, dateFrom, dateTo, page, limit } = req.query;
  
  const bookings = await ownerService.getVenueBookings(venueId, req.user._id, { 
    status, 
    dateFrom, 
    dateTo, 
    page, 
    limit 
  });
  
  res.status(200).json({
    success: true,
    data: { bookings },
  });
});

/**
 * Add court to venue
 */
const addCourtToVenue = catchAsync(async (req, res) => {
  const { id: venueId } = req.params;
  const courtData = req.body;
  
  const court = await ownerService.addCourtToVenue(venueId, courtData, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'Court added successfully',
    data: { court },
  });
});

/**
 * Update court
 */
const updateCourt = catchAsync(async (req, res) => {
  const { id: courtId } = req.params;
  const updateData = req.body;
  
  const court = await ownerService.updateCourt(courtId, updateData, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Court updated successfully',
    data: { court },
  });
});

/**
 * Get owner transactions
 */
const getOwnerTransactions = catchAsync(async (req, res) => {
  const { dateFrom, dateTo, page, limit } = req.query;
  
  const transactions = await ownerService.getOwnerTransactions(req.user._id, { 
    dateFrom, 
    dateTo, 
    page, 
    limit 
  });
  
  res.status(200).json({
    success: true,
    data: { transactions },
  });
});

module.exports = {
  getOwnerStats,
  getOwnerVenues,
  getVenueBookings,
  addCourtToVenue,
  updateCourt,
  getOwnerTransactions,
};
