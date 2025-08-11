const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user',
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  avatar: {
    type: String,
    default: null,
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    sports: [{ type: String }],
    location: {
      type: String,
      trim: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
