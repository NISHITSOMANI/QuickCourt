const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue is required'],
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: [true, 'Court is required'],
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
  },
  duration: {
    type: Number,
    required: true,
    min: [0.5, 'Minimum booking duration is 30 minutes'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'wallet', 'cash', 'bank_transfer'],
  },
  paymentId: String,
  transactionId: String,
  bookingReference: {
    type: String,
    unique: true,
    required: true,
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  refundReason: String,
  notes: {
    user: String,
    admin: String,
    owner: String,
  },
  metadata: {
    source: { type: String, enum: ['web', 'mobile', 'admin'], default: 'web' },
    userAgent: String,
    ipAddress: String,
    recurringBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringBooking' },
  },
  reminders: [{
    type: { type: String, enum: ['email', 'sms', 'push'] },
    sentAt: Date,
    status: { type: String, enum: ['sent', 'failed'] },
  }],
  checkIn: {
    time: Date,
    method: { type: String, enum: ['qr', 'manual', 'auto'] },
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  checkOut: {
    time: Date,
    method: { type: String, enum: ['qr', 'manual', 'auto'] },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ venue: 1, date: 1 });
bookingSchema.index({ court: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ createdAt: -1 });

// Compound index for availability checking
bookingSchema.index({ 
  court: 1, 
  date: 1, 
  startTime: 1, 
  endTime: 1,
  status: 1 
});

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  return this.duration;
});

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN');
});

// Virtual for time slot
bookingSchema.virtual('timeSlot').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for can cancel
bookingSchema.virtual('canCancel').get(function() {
  if (this.status !== 'pending' && this.status !== 'confirmed') {
    return false;
  }
  
  const now = new Date();
  const bookingDateTime = new Date(this.date);
  const [hours, minutes] = this.startTime.split(':');
  bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
  return hoursUntilBooking >= 2; // Can cancel up to 2 hours before
});

// Pre-save middleware to generate booking reference
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.bookingReference = `QC${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Pre-save middleware to calculate duration
bookingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    this.duration = (endTotalMinutes - startTotalMinutes) / 60;
  }
  next();
});

// Method to check for conflicts
bookingSchema.statics.checkConflict = async function(courtId, date, startTime, endTime, excludeBookingId = null) {
  const query = {
    court: courtId,
    date: new Date(date),
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBooking = await this.findOne(query);
  return !!conflictingBooking;
};

// Method to cancel booking
bookingSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);
