const catchAsync = require('../utils/catchAsync');
const timeslotService = require('../services/timeslotService');
const AppError = require('../utils/appError');

/**
 * Get timeslots for a venue
 */
const getTimeslotsByVenue = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const { date } = req.query;
  
  const timeslots = await timeslotService.getTimeslotsByVenue(venueId, date);
  
  res.status(200).json({
    success: true,
    data: { timeslots },
  });
});

/**
 * Create a new timeslot
 */
const createTimeslot = catchAsync(async (req, res) => {
  const { venueId } = req.params;
  const timeslotData = req.body;
  
  const timeslot = await timeslotService.createTimeslot(venueId, timeslotData, req.user._id);
  
  res.status(201).json({
    success: true,
    message: 'Timeslot created successfully',
    data: { timeslot },
  });
});

/**
 * Update timeslot
 */
const updateTimeslot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const timeslot = await timeslotService.updateTimeslot(id, updateData, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Timeslot updated successfully',
    data: { timeslot },
  });
});

/**
 * Delete timeslot
 */
const deleteTimeslot = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await timeslotService.deleteTimeslot(id, req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Timeslot deleted successfully',
  });
});

module.exports = {
  getTimeslotsByVenue,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
};
