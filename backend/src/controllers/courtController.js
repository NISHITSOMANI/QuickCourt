const catchAsync = require('../utils/catchAsync');
const courtService = require('../services/courtService');
const AppError = require('../utils/appError');

/**
 * Get all courts for a venue
 */
const getCourtsByVenue = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const courts = await courtService.getCourtsByVenue(venueId);
  
  res.status(200).json({
    success: true,
    data: { courts },
  });
});

/**
 * Get court by ID
 */
const getCourtById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const court = await courtService.getCourtById(id);
  
  if (!court) {
    return next(new AppError('Court not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: { court },
  });
});

/**
 * Create a new court
 */
const createCourt = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const courtData = req.body;
  
  const court = await courtService.createCourt(venueId, courtData, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'Court created successfully',
    data: { court },
  });
});

/**
 * Update court
 */
const updateCourt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const court = await courtService.updateCourt(id, updateData, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Court updated successfully',
    data: { court },
  });
});

/**
 * Delete court
 */
const deleteCourt = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await courtService.deleteCourt(id, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Court deleted successfully',
  });
});

/**
 * Get court availability
 */
const getCourtAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  const availability = await courtService.getCourtAvailability(id, date);
  
  res.status(200).json({
    success: true,
    data: { availability },
  });
});

/**
 * Block court slot
 */
const blockCourtSlot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, reason } = req.body;
  
  const result = await courtService.blockCourtSlot(id, date, startTime, endTime, reason, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Court slot blocked successfully',
    data: { blockId: result._id },
  });
});

/**
 * Unblock court slot
 */
const unblockCourtSlot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { blockId } = req.body;
  
  await courtService.unblockCourtSlot(id, blockId, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Court slot unblocked successfully',
  });
});

module.exports = {
  getCourtsByVenue,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
  getCourtAvailability,
  blockCourtSlot,
  unblockCourtSlot,
};
