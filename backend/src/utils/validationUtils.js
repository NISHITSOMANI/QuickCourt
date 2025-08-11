const Joi = require('joi');

/**
 * Common validation schemas for QuickCourt backend
 */

// Base schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const email = Joi.string().email().lowercase();
const phone = Joi.string().regex(/^[6-9]\d{9}$/).message('Invalid phone number format');
const password = Joi.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character');

// User schemas
const userRegister = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: email.required(),
  phone: phone.required(),
  password: password.required(),
  role: Joi.string().valid('user', 'owner').default('user'),
});

const userLogin = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

const userUpdate = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: phone,
  avatar: Joi.string().uri(),
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true),
    }),
    language: Joi.string().valid('en', 'hi').default('en'),
    timezone: Joi.string().default('Asia/Kolkata'),
  }),
});

// Venue schemas
const venueCreate = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India'),
  }).required(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).required(),
  sports: Joi.array().items(Joi.string().valid(
    'badminton', 'tennis', 'cricket', 'football', 'basketball', 
    'volleyball', 'squash', 'table-tennis', 'swimming', 'gym'
  )).min(1).required(),
  amenities: Joi.array().items(Joi.string()),
  operatingHours: Joi.object().pattern(
    Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    Joi.object({
      open: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    })
  ),
  contactInfo: Joi.object({
    phone: phone.required(),
    email: email,
    website: Joi.string().uri(),
  }).required(),
});

const venueUpdate = Joi.object({
  name: Joi.string().min(2).max(200),
  description: Joi.string().max(2000),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string(),
  }),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }),
  sports: Joi.array().items(Joi.string().valid(
    'badminton', 'tennis', 'cricket', 'football', 'basketball', 
    'volleyball', 'squash', 'table-tennis', 'swimming', 'gym'
  )).min(1),
  amenities: Joi.array().items(Joi.string()),
  operatingHours: Joi.object().pattern(
    Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    Joi.object({
      open: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean(),
    })
  ),
  contactInfo: Joi.object({
    phone: phone,
    email: email,
    website: Joi.string().uri(),
  }),
});

// Booking schemas
const bookingCreate = Joi.object({
  venue: objectId.required(),
  court: objectId.required(),
  date: Joi.date().min('now').required(),
  startTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  notes: Joi.string().max(500),
  paymentMethod: Joi.string().valid('card', 'upi', 'wallet', 'cash').default('card'),
});

// Query schemas
const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const venueQuery = Joi.object({
  q: Joi.string().max(100),
  sport: Joi.string().valid(
    'badminton', 'tennis', 'cricket', 'football', 'basketball', 
    'volleyball', 'squash', 'table-tennis', 'swimming', 'gym'
  ),
  city: Joi.string().max(100),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  amenities: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  radius: Joi.number().min(0).max(50).default(10),
  available: Joi.boolean(),
  date: Joi.date(),
  startTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
}).concat(paginationQuery);

const dateRange = Joi.object({
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year', 'last7days', 'last30days'),
  granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
});

// Param schemas
const mongoId = Joi.object({
  id: objectId.required(),
});

// Custom validators
const validateTimeRange = (req, res, next) => {
  const { startTime, endTime } = req.body;
  
  if (startTime && endTime) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }
    
    const duration = (end - start) / (1000 * 60); // minutes
    if (duration < 60) {
      return res.status(400).json({
        success: false,
        message: 'Minimum booking duration is 1 hour',
      });
    }
    
    if (duration > 480) { // 8 hours
      return res.status(400).json({
        success: false,
        message: 'Maximum booking duration is 8 hours',
      });
    }
  }
  
  next();
};

const validateBookingDate = (req, res, next) => {
  const { date } = req.body;
  
  if (date) {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates',
      });
    }
    
    const maxAdvanceDays = process.env.BOOKING_ADVANCE_LIMIT_DAYS || 30;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + parseInt(maxAdvanceDays));
    
    if (bookingDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot book more than ${maxAdvanceDays} days in advance`,
      });
    }
  }
  
  next();
};

module.exports = {
  schemas: {
    objectId,
    email,
    phone,
    password,
    userRegister,
    userLogin,
    userUpdate,
    venueCreate,
    venueUpdate,
    bookingCreate,
    paginationQuery,
    venueQuery,
    dateRange,
    mongoId,
  },
  validators: {
    validateTimeRange,
    validateBookingDate,
  },
};
