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
  // Base schemas
  mongoId: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),
  
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  ownerStatsQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    venueId: Joi.string().hex().length(24),
    groupBy: Joi.string().valid('day', 'week', 'month', 'year').default('day')
  }),
  
  venueBookingsQuery: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sortBy: Joi.string().valid('date', 'createdAt', 'price').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),
  
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),
  
  analyticsQuery: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'year').default('day'),
    venueId: Joi.string().hex().length(24),
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym'),
    includeCanceled: Joi.boolean().default(false),
    includeNoShows: Joi.boolean().default(false),
    timezone: Joi.string().default('UTC')
  }),
  
  notificationCreate: Joi.object({
    title: Joi.string().trim().min(2).max(100).required(),
    message: Joi.string().trim().min(5).required(),
    type: Joi.string().valid('info', 'success', 'warning', 'error').default('info'),
    userId: Joi.string().hex().length(24),
    venueId: Joi.string().hex().length(24),
    bookingId: Joi.string().hex().length(24),
    read: Joi.boolean().default(false)
  }),
  
  // Court related schemas
  courtCreate: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym').required(),
    pricePerHour: Joi.number().min(0).required(),
    operatingHours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
        isClosed: Joi.boolean().default(false)
      })
    ).required(),
    amenities: Joi.array().items(Joi.string().trim()).default([]),
    images: Joi.array().items(Joi.string().uri()).default([]),
    isActive: Joi.boolean().default(true)
  }),
  
  courtUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym'),
    pricePerHour: Joi.number().min(0),
    operatingHours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
        isClosed: Joi.boolean()
      })
    ),
    amenities: Joi.array().items(Joi.string().trim()),
    images: Joi.array().items(Joi.string().uri()),
    isActive: Joi.boolean()
  }),
  
  courtBlockSlot: Joi.object({
    date: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    reason: Joi.string().trim().max(500).required()
  }),
  
  courtUnblockSlot: Joi.object({
    date: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required()
  }),
  
  // Payment related schemas
  paymentSimulation: Joi.object({
    amount: Joi.number().min(1).required(),
    currency: Joi.string().valid('INR', 'USD').default('INR'),
    paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'upi', 'netbanking', 'wallet').required(),
    bookingId: Joi.string().hex().length(24).required(),
    savePaymentMethod: Joi.boolean().default(false)
  }),
  
  // Report related schemas
  reportCreate: Joi.object({
    title: Joi.string().trim().min(5).max(100).required(),
    description: Joi.string().trim().min(10).required(),
    type: Joi.string().valid('bug', 'feature', 'improvement', 'other').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    metadata: Joi.object().default({})
  }),
  
  reportQuery: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    type: Joi.string().valid('bug', 'feature', 'improvement', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    assignedTo: Joi.string().hex().length(24),
    reportedBy: Joi.string().hex().length(24),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  reportUpdate: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    assignedTo: Joi.string().hex().length(24),
    comments: Joi.array().items(Joi.object({
      text: Joi.string().required(),
      userId: Joi.string().hex().length(24).required()
    })),
    metadata: Joi.object()
  }),
  
  // Timeslot related schemas
  timeslotCreate: Joi.object({
    date: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    price: Joi.number().min(0).required(),
    isBlocked: Joi.boolean().default(false),
    blockReason: Joi.string().when('isBlocked', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') })
  }),
  
  timeslotUpdate: Joi.object({
    price: Joi.number().min(0),
    isBlocked: Joi.boolean(),
    blockReason: Joi.string().when('isBlocked', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') })
  }),
  
  // Venue related schemas
  venueCreate: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).required(),
    address: Joi.object({
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
      postalCode: Joi.string().trim().required(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      }).required()
    }).required(),
    contact: Joi.object({
      phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/).required(),
      email: Joi.string().email().lowercase().trim().required(),
      website: Joi.string().uri().allow('')
    }).required(),
    facilities: Joi.array().items(Joi.string().trim()).default([]),
    images: Joi.array().items(Joi.string().uri()).default([]),
    isActive: Joi.boolean().default(true),
    ownerNotes: Joi.string().trim().allow('')
  }),
  
  venueUpdate: Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().min(10),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      country: Joi.string().trim(),
      postalCode: Joi.string().trim(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90),
        lng: Joi.number().min(-180).max(180)
      })
    }),
    contact: Joi.object({
      phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/),
      email: Joi.string().email().lowercase().trim(),
      website: Joi.string().uri().allow('')
    }),
    facilities: Joi.array().items(Joi.string().trim()),
    images: Joi.array().items(Joi.string().uri()),
    isActive: Joi.boolean(),
    ownerNotes: Joi.string().trim().allow('')
  }),
  
  venueQuery: Joi.object({
    sportType: Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym'),
    priceMin: Joi.number().min(0),
    priceMax: Joi.number().min(0),
    venueType: Joi.string().valid('indoor', 'outdoor', 'mixed'),
    rating: Joi.number().min(0).max(5),
    amenities: Joi.string(),
    search: Joi.string().trim(),
    sortBy: Joi.string().valid('price', 'rating', 'distance').default('rating'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    isActive: Joi.boolean()
  }),
  
  // Review related schemas
  reviewCreate: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().min(10).max(1000).required(),
    images: Joi.array().items(Joi.string().uri()).max(5).default([])
  }),
  
  reviewUpdate: Joi.object({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().trim().min(10).max(1000),
    images: Joi.array().items(Joi.string().uri()).max(5)
  }),
  
  // User related schemas
  userUpdate: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(1).max(50),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/),
    dateOfBirth: Joi.date().max('now').iso(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say'),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      country: Joi.string().trim(),
      postalCode: Joi.string().trim(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90),
        lng: Joi.number().min(-180).max(180)
      })
    }),
    preferences: Joi.object({
      notifications: Joi.boolean().default(true),
      emailNotifications: Joi.boolean().default(true),
      pushNotifications: Joi.boolean().default(true),
      preferredSports: Joi.array().items(Joi.string().valid('cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym')),
      preferredLocations: Joi.array().items(Joi.string().trim())
    }),
    profilePicture: Joi.string().uri().allow('')
  }),
  
  // Common schemas
  date: Joi.object({
    date: Joi.date().iso().required()
  }),
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
  courtBlockSlot: Joi.object({
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    reason: Joi.string().trim().min(5).max(500).required(),
  }),

  courtUnblockSlot: Joi.object({
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  }),

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

  // Timeslot validation schemas
  timeslotCreate: Joi.object({
    courtId: Joi.string().hex().length(24).required(),
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    status: Joi.string().valid('available', 'booked', 'blocked', 'maintenance').default('available'),
    price: Joi.number().min(0).optional(),
    notes: Joi.string().trim().max(500).optional(),
  }),

  timeslotUpdate: Joi.object({
    status: Joi.string().valid('available', 'booked', 'blocked', 'maintenance').optional(),
    price: Joi.number().min(0).optional(),
    notes: Joi.string().trim().max(500).optional(),
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

  // Payment validation schemas
  paymentSimulation: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('INR'),
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet', 'emi').required(),
    metadata: Joi.object({
      bookingId: Joi.string().hex().length(24).optional(),
      userId: Joi.string().hex().length(24).optional(),
      description: Joi.string().optional(),
    }).optional(),
  }),

  paymentCreate: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('INR'),
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet', 'emi').required(),
    bookingId: Joi.string().hex().length(24).required(),
    userId: Joi.string().hex().length(24).required(),
    metadata: Joi.object({
      cardLast4: Joi.string().length(4).optional(),
      upiId: Joi.string().email().optional(),
      bankName: Joi.string().optional(),
      walletName: Joi.string().optional(),
    }).optional(),
  }),

  paymentWebhook: Joi.object({
    event: Joi.string().required(),
    data: Joi.object({
      id: Joi.string().required(),
      amount: Joi.number().positive().required(),
      status: Joi.string().valid('succeeded', 'failed', 'processing', 'refunded').required(),
      payment_method: Joi.string().required(),
      created: Joi.number().required(),
      metadata: Joi.object({
        bookingId: Joi.string().hex().length(24).optional(),
        userId: Joi.string().hex().length(24).optional(),
      }).optional(),
    }).required(),
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
const validateBody = (schemaName) => {
  if (!schemas[schemaName]) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }
  return validate(schemas[schemaName], 'body');
};

const validateQuery = (schemaName) => {
  if (!schemas[schemaName]) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }
  return validate(schemas[schemaName], 'query');
};

const validateParams = (schemaName) => {
  if (!schemas[schemaName]) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }
  return validate(schemas[schemaName], 'params');
};

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
