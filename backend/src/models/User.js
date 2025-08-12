const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const OTP_EXPIRATION_MINUTES = 10; // OTP expires in 10 minutes
const MAX_OTP_ATTEMPTS = 3; // Maximum number of OTP verification attempts

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
  // OTP fields for password reset
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  passwordResetOtpAttempts: {
    type: Number,
    default: 0,
  },
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

// Method to generate and store OTP for password reset
userSchema.methods.generatePasswordResetOtp = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP before storing
  this.passwordResetOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
    
  // Set OTP expiration (10 minutes from now)
  this.passwordResetOtpExpires = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;
  
  // Reset OTP attempts
  this.passwordResetOtpAttempts = 0;
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyPasswordResetOtp = async function(candidateOtp) {
  // Check if OTP exists and is not expired
  if (!this.passwordResetOtp || !this.passwordResetOtpExpires) {
    throw new Error('No OTP requested or OTP expired');
  }
  
  // Check if OTP is expired
  if (this.passwordResetOtpExpires < Date.now()) {
    this.passwordResetOtp = undefined;
    this.passwordResetOtpExpires = undefined;
    await this.save({ validateBeforeSave: false });
    throw new Error('OTP has expired');
  }
  
  // Check if max attempts exceeded
  if (this.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
  }
  
  // Hash the candidate OTP and compare with stored hash
  const hashedCandidateOtp = crypto
    .createHash('sha256')
    .update(candidateOtp)
    .digest('hex');
  
  const isMatch = this.passwordResetOtp === hashedCandidateOtp;
  
  // Increment OTP attempts if verification fails
  if (!isMatch) {
    this.passwordResetOtpAttempts += 1;
    await this.save({ validateBeforeSave: false });
    
    const remainingAttempts = MAX_OTP_ATTEMPTS - this.passwordResetOtpAttempts;
    throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
  }
  
  // If OTP is correct, generate a password reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Clear OTP fields after successful verification
  this.passwordResetOtp = undefined;
  this.passwordResetOtpExpires = undefined;
  this.passwordResetOtpAttempts = 0;
  
  await this.save({ validateBeforeSave: false });
  return resetToken;
};

// Method to generate password reset token (kept for backward compatibility)
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
