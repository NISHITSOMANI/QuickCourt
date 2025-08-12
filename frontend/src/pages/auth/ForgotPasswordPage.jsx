import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Lock, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  // Timer for OTP expiration
  useEffect(() => {
    if (!otpExpiry) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(otpExpiry).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.ceil(difference / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiry]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResendOtp = async () => {
    try {
      setIsSubmitting(true);
      const result = await authApi.forgotPassword(email);
      setOtpExpiry(result.otpExpiry);
      toast.success('New OTP sent to your email');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEmail = async (data) => {
    try {
      setIsSubmitting(true);
      const result = await authApi.forgotPassword(data.email);
      setEmail(data.email);
      setOtpExpiry(result.otpExpiry);
      setStep(2);
      toast.success('OTP sent to your email');
    } catch (error) {
      console.error('Error sending OTP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitOtp = async (data) => {
    try {
      setIsSubmitting(true);
      const result = await authApi.verifyOtp(email, data.otp);
      setResetToken(result.resetToken);
      setStep(3);
      toast.success('OTP verified successfully');
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitNewPassword = async (data) => {
    try {
      setIsSubmitting(true);
      await authApi.resetPassword(resetToken, data.password, data.confirmPassword);
      toast.success('Password reset successful! You can now log in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepOne = () => (
    <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Forgot Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmitEmail)}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      </form>

      <div className="text-center text-sm">
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
        </Link>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Verify OTP
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter the 6-digit OTP sent to <span className="font-medium">{email}</span>
        </p>
        {timeLeft > 0 && (
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1" />
            OTP expires in {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmitOtp)}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              6-digit OTP
            </label>
            <div className="relative">
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={`appearance-none block w-full px-3 py-2 border ${errors.otp ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest`}
                placeholder="123456"
                {...register('otp', {
                  required: 'OTP is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'OTP must be 6 digits',
                  },
                })}
              />
            </div>
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isSubmitting || timeLeft <= 0}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${timeLeft <= 0 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isSubmitting || timeLeft > 30}
              className={`font-medium ${timeLeft > 30 ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-500'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              Didn't receive code? {timeLeft > 30 ? `Resend in ${formatTime(timeLeft - 30)}` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </form>

      <div className="text-center text-sm">
        <button
          onClick={() => setStep(1)}
          className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Create New Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your OTP has been verified. Please enter your new password.
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmitNewPassword)}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  validate: (value) => {
                    const hasUpperCase = /[A-Z]/.test(value);
                    const hasLowerCase = /[a-z]/.test(value);
                    const hasNumber = /\d/.test(value);
                    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                    
                    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
                      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
                    }
                    return true;
                  },
                })}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => {
                    if (value !== watch('password')) {
                      return 'Passwords do not match';
                    }
                    return true;
                  },
                })}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            QuickCourt
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
