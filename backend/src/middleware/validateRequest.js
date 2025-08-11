const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message.replace(/"/g, ''))
        .join(', ');
      
      return next(new AppError(`Validation error: ${errorMessage}`, 400));
    }

    // Replace the original data with validated data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User validation schemas
  userRegister: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('user', 'owner').default('user'),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  userUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    avatar: Joi.string().uri().optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
      }).optional(),
      sports: Joi.array().items(Joi.string()).optional(),
      location: Joi.string().trim().optional(),
    }).optional(),
  }),

  // Venue validation schemas
  venueCreate: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().max(2000).optional(),
    address: Joi.object({
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      zipCode: Joi.string().trim().required(),
      country: Joi.string().trim().default('India'),
    }).required(),
    shortLocation: Joi.string().trim().max(100).optional(),
    locationCoords: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
    }).optional(),
    venueType: Joi.string().valid('indoor', 'outdoor', 'mixed').default('mixed'),
    sports: Joi.array().items(
      Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym')
    ).min(1).required(),
    startingPrice: Joi.number().min(0).required(),
    amenities: Joi.array().items(
      Joi.string().valid('parking', 'restrooms', 'changing_rooms', 'cafeteria', 'wifi', 'ac', 'lighting', 'equipment_rental', 'first_aid')
    ).optional(),
    operatingHours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().default(false),
      })
    ).optional(),
  }),

  venueUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().max(2000).optional(),
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
    }).optional(),
    shortLocation: Joi.string().trim().max(100).optional(),
    locationCoords: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
    }).optional(),
    venueType: Joi.string().valid('indoor', 'outdoor', 'mixed').optional(),
    sports: Joi.array().items(
      Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym')
    ).min(1).optional(),
    startingPrice: Joi.number().min(0).optional(),
    amenities: Joi.array().items(
      Joi.string().valid('parking', 'restrooms', 'changing_rooms', 'cafeteria', 'wifi', 'ac', 'lighting', 'equipment_rental', 'first_aid')
    ).optional(),
    operatingHours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional(),
      })
    ).optional(),
  }),

  // Court validation schemas
  courtCreate: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym').required(),
    pricePerHour: Joi.number().min(0).required(),
    operatingHours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().default(false),
      })
    ).optional(),
    dimensions: Joi.object({
      length: Joi.number().positive().optional(),
      width: Joi.number().positive().optional(),
      unit: Joi.string().valid('meters', 'feet').default('meters'),
    }).optional(),
    surface: Joi.string().valid('grass', 'artificial_turf', 'concrete', 'wood', 'clay', 'synthetic', 'tiles').optional(),
    capacity: Joi.number().min(1).optional(),
    amenities: Joi.array().items(
      Joi.string().valid('lighting', 'ac', 'sound_system', 'scoreboard', 'equipment', 'seating', 'water')
    ).optional(),
  }),

  // Booking validation schemas
  bookingCreate: Joi.object({
    courtId: Joi.string().hex().length(24).required(),
    venueId: Joi.string().hex().length(24).required(),
    date: Joi.date().min('now').required(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    paymentMethod: Joi.string().valid('card', 'upi', 'wallet', 'cash', 'bank_transfer').optional(),
    meta: Joi.object().optional(),
  }),

  // Review validation schemas
  reviewCreate: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    title: Joi.string().trim().max(200).optional(),
    comment: Joi.string().trim().max(1000).optional(),
  }),

  // Query parameter validation schemas
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
  }),

  venueQuery: Joi.object({
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym').optional(),
    priceMin: Joi.number().min(0).optional(),
    priceMax: Joi.number().min(0).optional(),
    venueType: Joi.string().valid('indoor', 'outdoor', 'mixed').optional(),
    rating: Joi.number().min(0).max(5).optional(),
    q: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().optional(),
  }),

  // ID parameter validation
  mongoId: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  // Date range validation
  dateRange: Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional(),
  }),
};

// Validation middleware functions
const validateBody = (schemaName) => validate(schemas[schemaName], 'body');
const validateQuery = (schemaName) => validate(schemas[schemaName], 'query');
const validateParams = (schemaName) => validate(schemas[schemaName], 'params');

// Custom validation for time ranges
const validateTimeRange = (req, res, next) => {
  const { startTime, endTime } = req.body;
  
  if (startTime && endTime) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
      return next(new AppError('End time must be after start time', 400));
    }
    
    // Check minimum duration (30 minutes)
    const diffMinutes = (end - start) / (1000 * 60);
    if (diffMinutes < 30) {
      return next(new AppError('Minimum booking duration is 30 minutes', 400));
    }
  }
  
  next();
};

// Custom validation for booking date
const validateBookingDate = (req, res, next) => {
  const { date } = req.body;
  
  if (date) {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return next(new AppError('Cannot book for past dates', 400));
    }
    
    // Check advance booking limit (30 days default)
    const maxAdvanceDays = 30;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    
    if (bookingDate > maxDate) {
      return next(new AppError(`Cannot book more than ${maxAdvanceDays} days in advance`, 400));
    }
  }
  
  next();
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateTimeRange,
  validateBookingDate,
  schemas,
};
