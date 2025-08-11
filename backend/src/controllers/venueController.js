const venueService = require('../services/venueService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Get all venues with filters
 */
const getVenues = catchAsync(async (req, res) => {
  const result = await venueService.getVenues(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get popular venues
 */
const getPopularVenues = catchAsync(async (req, res) => {
  const { limit } = req.query;
  const venues = await venueService.getPopularVenues(limit);

  res.status(200).json({
    success: true,
    data: { venues },
  });
});

/**
 * Get venue by ID
 */
const getVenueById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const venue = await venueService.getVenueById(id);

  res.status(200).json({
    success: true,
    data: { venue },
  });
});

/**
 * Create new venue
 */
const createVenue = catchAsync(async (req, res) => {
  const venue = await venueService.createVenue(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Venue created successfully',
    data: { venue },
  });
});

/**
 * Update venue
 */
const updateVenue = catchAsync(async (req, res) => {
  const { id } = req.params;
  const venue = await venueService.updateVenue(id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Venue updated successfully',
    data: { venue },
  });
});

/**
 * Delete venue
 */
const deleteVenue = catchAsync(async (req, res) => {
  const { id } = req.params;
  await venueService.deleteVenue(id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Venue deleted successfully',
  });
});

/**
 * Get venue gallery
 */
const getVenueGallery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const venue = await venueService.getVenueById(id);

  res.status(200).json({
    success: true,
    data: { photos: venue.photos },
  });
});

/**
 * Add photos to venue
 */
const addPhotos = catchAsync(async (req, res) => {
  const { id } = req.params;
  const photos = req.files?.map(file => ({
    url: file.url,
    caption: req.body.caption || '',
  })) || [];

  const updatedPhotos = await venueService.addPhotos(id, photos, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Photos added successfully',
    data: { photos: updatedPhotos },
  });
});

/**
 * Delete photo from venue
 */
const deletePhoto = catchAsync(async (req, res) => {
  const { id, photoId } = req.params;
  await venueService.deletePhoto(id, photoId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Photo deleted successfully',
  });
});

/**
 * Get venue availability
 */
const getVenueAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date parameter is required',
    });
  }

  const availability = await venueService.getVenueAvailability(id, date);

  res.status(200).json({
    success: true,
    data: availability,
  });
});

/**
 * Get venue reviews
 */
const getVenueReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const Review = require('../models/Review');
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ venue: id, status: 'active' })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name avatar')
      .lean(),
    Review.countDocuments({ venue: id, status: 'active' })
  ]);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

module.exports = {
  getVenues,
  getPopularVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueGallery,
  addPhotos,
  deletePhoto,
  getVenueAvailability,
  getVenueReviews,
};
