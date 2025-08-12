const nodemailer = require('nodemailer');
const CircuitBreaker = require('opossum');
const config = require('../config/env');
const { logger } = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.circuitBreaker = null;
    this.init();
  }

  /**
   * Initialize email service with circuit breaker
   */
  init() {
    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.auth,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      // Circuit breaker options
      const breakerOptions = {
        timeout: config.circuitBreaker.timeout,
        errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
        resetTimeout: config.circuitBreaker.resetTimeout,
        name: 'EmailService',
      };

      // Wrap send method with circuit breaker
      this.circuitBreaker = new CircuitBreaker(this.sendMail.bind(this), breakerOptions);

      // Circuit breaker event handlers
      this.circuitBreaker.on('open', () => {
        logger.warn('Email service circuit breaker opened');
      });

      this.circuitBreaker.on('halfOpen', () => {
        logger.info('Email service circuit breaker half-open');
      });

      this.circuitBreaker.on('close', () => {
        logger.info('Email service circuit breaker closed');
      });

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Send email with retry logic
   */
  async sendMail(mailOptions) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });
      return info;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send email through circuit breaker
   */
  async send(mailOptions) {
    try {
      return await this.circuitBreaker.fire(mailOptions);
    } catch (error) {
      logger.error('Email service circuit breaker error:', error);
      throw error;
    }
  }

  /**
   * Send OTP for password reset
   */
  async sendPasswordResetOtpEmail(email, name, otp) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Your QuickCourt Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Password Reset Request</h1>
            <p style="color: #4b5563; margin-bottom: 20px;">Use the following OTP to reset your password. This OTP is valid for 10 minutes.</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this OTP, you can safely ignore this email. Your account is secure.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            <p>This email was sent to ${email} because you requested a password reset for your QuickCourt account.</p>
          </div>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmationEmail(email, name) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Your QuickCourt Password Has Been Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Password Successfully Reset</h1>
            <p style="color: #4b5563; margin-bottom: 20px;">Your QuickCourt account password was successfully changed.</p>
          </div>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #065f46; margin: 0;">
              If you did not make this change and believe your account may have been compromised, please contact our support team immediately.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <h3 style="color: #111827; margin-top: 0;">Security Tips:</h3>
            <ul style="padding-left: 20px; color: #4b5563;">
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Change your password regularly</li>
              <li>Be cautious of phishing attempts</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated message, please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Welcome to QuickCourt!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to QuickCourt!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for joining QuickCourt, your premier sports venue booking platform!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse and book sports venues</li>
            <li>Manage your bookings</li>
            <li>Leave reviews for venues</li>
            <li>Track your booking history</li>
          </ul>
          <p>Get started by exploring our venues and making your first booking!</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, resetUrl) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Reset Your QuickCourt Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hi ${name},</p>
          <p>You requested a password reset for your QuickCourt account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 10 minutes for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(email, name, booking) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Booking Confirmation - QuickCourt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Booking Confirmed!</h1>
          <p>Hi ${name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p><strong>Venue:</strong> ${booking.venue?.name}</p>
            <p><strong>Court:</strong> ${booking.court?.name}</p>
            <p><strong>Date:</strong> ${booking.formattedDate}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Duration:</strong> ${booking.duration} hours</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
          </div>
          <p>Please arrive 10 minutes before your booking time.</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellationEmail(email, name, booking) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Booking Cancelled - QuickCourt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Booking Cancelled</h1>
          <p>Hi ${name},</p>
          <p>Your booking has been cancelled. Here are the details:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Cancelled Booking Details</h3>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p><strong>Venue:</strong> ${booking.venue?.name}</p>
            <p><strong>Court:</strong> ${booking.court?.name}</p>
            <p><strong>Date:</strong> ${booking.formattedDate}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Refund Amount:</strong> ₹${booking.refundAmount}</p>
          </div>
          <p>Your refund will be processed within 3-5 business days.</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send booking reminder email
   */
  async sendBookingReminderEmail(email, name, booking) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Booking Reminder - QuickCourt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Booking Reminder</h1>
          <p>Hi ${name},</p>
          <p>This is a reminder for your upcoming booking:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p><strong>Venue:</strong> ${booking.venue?.name}</p>
            <p><strong>Court:</strong> ${booking.court?.name}</p>
            <p><strong>Date:</strong> ${booking.formattedDate}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
          </div>
          <p>Please arrive 10 minutes before your booking time.</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Send venue approval email to owner
   */
  async sendVenueApprovalEmail(email, name, venue) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Venue Approved - QuickCourt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Venue Approved!</h1>
          <p>Hi ${name},</p>
          <p>Great news! Your venue has been approved and is now live on QuickCourt:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Venue Details</h3>
            <p><strong>Name:</strong> ${venue.name}</p>
            <p><strong>Location:</strong> ${venue.fullAddress}</p>
            <p><strong>Sports:</strong> ${venue.sports.join(', ')}</p>
          </div>
          <p>Users can now discover and book your venue. Start receiving bookings today!</p>
          <p>Best regards,<br>The QuickCourt Team</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  /**
   * Health check for email service
   */
  async healthCheck() {
    try {
      await this.transporter.verify();
      return {
        status: 'healthy',
        circuitBreakerState: this.circuitBreaker?.stats || 'unknown',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        circuitBreakerState: this.circuitBreaker?.stats || 'unknown',
      };
    }
  }
}

module.exports = new EmailService();
