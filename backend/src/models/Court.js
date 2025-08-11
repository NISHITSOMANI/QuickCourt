const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Court name is required'],
    trim: true,
    maxlength: [100, 'Court name cannot exceed 100 characters'],
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue is required'],
  },
  sportType: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym'],
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price per hour is required'],
    min: [0, 'Price cannot be negative'],
  },
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } },
  },
  dimensions: {
    length: Number,
    width: Number,
    unit: { type: String, enum: ['meters', 'feet'], default: 'meters' },
  },
  surface: {
    type: String,
    enum: ['grass', 'artificial_turf', 'concrete', 'wood', 'clay', 'synthetic', 'tiles'],
  },
  capacity: {
    type: Number,
    min: 1,
  },
  amenities: [{
    type: String,
    enum: ['lighting', 'ac', 'sound_system', 'scoreboard', 'equipment', 'seating', 'water'],
  }],
  photos: [{
    url: { type: String, required: true },
    caption: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  blockedSlots: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  metadata: {
    lastBooking: Date,
    totalRevenue: { type: Number, default: 0 },
    avgBookingDuration: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
courtSchema.index({ venue: 1 });
courtSchema.index({ sportType: 1 });
courtSchema.index({ status: 1 });
courtSchema.index({ pricePerHour: 1 });
courtSchema.index({ 'rating.average': -1 });
courtSchema.index({ createdAt: -1 });
courtSchema.index({ 'blockedSlots.date': 1 });

// Method to check availability for a specific time slot
courtSchema.methods.isAvailable = function(date, startTime, endTime) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Check if court is closed on this day
  const daySchedule = this.operatingHours[dayOfWeek];
  if (daySchedule && daySchedule.closed) {
    return false;
  }

  // Check operating hours
  if (daySchedule && daySchedule.open && daySchedule.close) {
    if (startTime < daySchedule.open || endTime > daySchedule.close) {
      return false;
    }
  }

  // Check blocked slots
  const isBlocked = this.blockedSlots.some(slot => {
    const slotDate = new Date(slot.date);
    return slotDate.toDateString() === targetDate.toDateString() &&
           ((startTime >= slot.startTime && startTime < slot.endTime) ||
            (endTime > slot.startTime && endTime <= slot.endTime) ||
            (startTime <= slot.startTime && endTime >= slot.endTime));
  });

  return !isBlocked;
};

// Method to block time slot
courtSchema.methods.blockSlot = function(date, startTime, endTime, reason, createdBy) {
  this.blockedSlots.push({
    date: new Date(date),
    startTime,
    endTime,
    reason,
    createdBy,
  });
  return this.save();
};

// Method to unblock time slot
courtSchema.methods.unblockSlot = function(blockId) {
  this.blockedSlots.id(blockId).remove();
  return this.save();
};

module.exports = mongoose.model('Court', courtSchema);
