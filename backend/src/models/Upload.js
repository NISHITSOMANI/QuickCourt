const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['venue_photo', 'profile_avatar', 'document', 'other'],
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
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
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ type: 1 });
uploadSchema.index({ filename: 1 });

// Update the updatedAt field before saving
uploadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Upload', uploadSchema);
