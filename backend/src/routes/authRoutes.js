const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authRateLimit } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateRequest');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', 
  authRateLimit,
  validateBody('userRegister'),
  authController.register
);

router.post('/login',
  authRateLimit,
  validateBody('userLogin'),
  authController.login
);

router.post('/refresh',
  authController.refreshToken
);

// Password reset flow with OTP
router.post('/forgot-password',
  authRateLimit,
  validateBody('forgotPassword'),
  authController.forgotPassword
);

router.post('/verify-otp',
  authRateLimit,
  validateBody('verifyOtp'),
  authController.verifyOtp
);

router.post('/reset-password',
  authRateLimit,
  validateBody('resetPassword'),
  authController.resetPassword
);

router.get('/verify-email',
  authController.verifyEmail
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/profile', 
  validateBody('userUpdate'),
  authController.updateProfile
);
router.post('/change-password', authController.changePassword);
router.post('/resend-verification', authController.resendEmailVerification);

module.exports = router;
