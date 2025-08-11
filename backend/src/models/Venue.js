const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: [200, 'Venue name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
  },
  shortLocation: {
    type: String,
    trim: true,
    maxlength: [100, 'Short location cannot exceed 100 characters'],
  },
  locationCoords: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  venueType: {
    type: String,
    enum: ['indoor', 'outdoor', 'mixed'],
    default: 'mixed',
  },
  sports: [{
    type: String,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym'],
    required: true,
  }],
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Price cannot be negative'],
  },
  amenities: [{
    type: String,
    enum: ['parking', 'restrooms', 'changing_rooms', 'cafeteria', 'wifi', 'ac', 'lighting', 'equipment_rental', 'first_aid'],
  }],
  photos: [{
    url: { type: String, required: true },
    caption: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  metadata: {
    totalCourts: { type: Number, default: 0 },
    avgCourtPrice: { type: Number, default: 0 },
    lastBooking: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
venueSchema.index({ owner: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ sports: 1 });
venueSchema.index({ 'address.city': 1 });
venueSchema.index({ startingPrice: 1 });
venueSchema.index({ 'rating.average': -1 });
venueSchema.index({ featured: -1, 'rating.average': -1 });
venueSchema.index({ createdAt: -1 });
venueSchema.index({ 'locationCoords.latitude': 1, 'locationCoords.longitude': 1 });

// Text search index
venueSchema.index({
  name: 'text',
  description: 'text',
  'address.city': 'text',
  shortLocation: 'text',
});

// Virtual for full address
venueSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for primary photo
venueSchema.virtual('primaryPhoto').get(function() {
  return this.photos.find(photo => photo.isPrimary) || this.photos[0] || null;
});

// Method to update rating
venueSchema.methods.updateRating = async function(newRating) {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { venue: this._id } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.rating.average = Math.round(stats[0].avgRating * 10) / 10;
    this.rating.count = stats[0].count;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }

  return this.save();
};

module.exports = mongoose.model('Venue', venueSchema);
