const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    // Format: HH:MM (24-hour)
  },
  endTime: {
    type: String,
    required: true,
    // Format: HH:MM (24-hour)
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: null,
  },
  status: {
    type: String,
    enum: ['available', 'blocked', 'booked'],
    default: 'available',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
timeslotSchema.index({ venue: 1, date: 1, startTime: 1 });
timeslotSchema.index({ court: 1, date: 1 });

// Update the updatedAt field before saving
timeslotSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Timeslot', timeslotSchema);
