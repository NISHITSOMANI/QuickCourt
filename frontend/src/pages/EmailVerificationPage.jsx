import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  
  const email = searchParams.get('email') || 'user@example.com'
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const watchedValues = watch(['code1', 'code2', 'code3', 'code4', 'code5', 'code6'])

  // Auto-focus next input
  useEffect(() => {
    const inputs = document.querySelectorAll('input[name^="code"]')
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus()
        }
      })
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus()
        }
      })
    })
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const onSubmit = async (data) => {
    const code = Object.values(data).join('')
    
    // Critical input validation
    if (!code || code.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    // Numeric validation
    if (!/^\d{6}$/.test(code)) {
      toast.error('Verification code must contain only numbers')
      return
    }

    // Email validation
    if (!email) {
      toast.error('Email address is required for verification')
      navigate('/register')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.verifyEmail({
        email: email.trim().toLowerCase(),
        code: code.trim()
      })

      if (response.data.success) {
        toast.success('Email verified successfully!')
        
        navigate('/login', {
          state: {
            message: 'Your email has been verified. You can now login.',
            email: email
          }
        })
      } else {
        toast.error('Verification failed. Please try again.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      
      // Enhanced error handling
      if (error.response?.status === 400) {
        toast.error('Invalid verification code. Please check and try again.')
      } else if (error.response?.status === 410) {
        toast.error('Verification code has expired. Please request a new one.')
      } else if (error.response?.status === 429) {
        toast.error('Too many verification attempts. Please try again later.')
      } else {
        toast.error(error.response?.data?.message || 'Verification failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return
    
    setResendLoading(true)
    try {
      await authApi.resendVerificationCode({ email })
      toast.success('Verification code sent!')
      setTimeLeft(60)
      setCanResend(false)
    } catch (error) {
      toast.error('Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  const isFormComplete = watchedValues.every(value => value && value.length === 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop and Mobile Layout */}
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">Q</span>
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900 tracking-wide">
              QUICKCOURT
            </h1>
            <div className="mt-4 flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-700">
                VERIFY YOUR EMAIL
              </h2>
            </div>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                We've sent a code to your email:
              </p>
              <p className="text-sm font-medium text-green-600">
                {email}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Verification Code Inputs */}
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <input
                    key={index}
                    {...register(`code${index}`, {
                      required: true,
                      pattern: /^[0-9]$/,
                      maxLength: 1,
                    })}
                    type="text"
                    maxLength="1"
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, '')
                    }}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormComplete || isLoading}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isFormComplete && !isLoading
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              {canResend ? (
                <button
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <span className="text-gray-500 text-sm">
                  Resend in {timeLeft}s
                </span>
              )}
            </div>

            {/* Wrong Email */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/register')}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Wrong email? Edit Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationPage
