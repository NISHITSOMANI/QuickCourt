import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from 'react-query'
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  Clock, 
  MapPin, 
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { bookingApi } from '../../api/bookingApi'
import toast from 'react-hot-toast'

const PaymentGatewayPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Get booking data from navigation state
  const { bookingId, bookingData, totalAmount } = location.state || {}
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: user?.name || ''
  })

  useEffect(() => {
    console.log('PaymentGatewayPage loaded successfully')
    console.log('Booking ID:', bookingId)
    console.log('Booking data:', bookingData)
    console.log('Total amount:', totalAmount)

    // Redirect if no booking data
    if (!bookingId || !bookingData) {
      console.log('No booking data found')
      toast.error('No booking data found. Please start from venue selection.')
      navigate('/venues')
      return
    }
  }, [bookingId, bookingData, totalAmount, navigate])

  // Payment processing mutation
  const { mutate: processPayment, isLoading: isProcessing } = useMutation(
    async (paymentData) => {
      try {
        const response = await bookingApi.processPayment(bookingId, paymentData)
        return response.data
      } catch (error) {
        console.error('Payment processing failed:', error)
        throw error
      }
    },
    {
      onSuccess: (data) => {
        toast.success('Payment processed successfully!')
        // Navigate to booking confirmation or my bookings
        navigate('/my-bookings', { 
          state: { 
            newBooking: data.booking || bookingData,
            showSuccess: true 
          } 
        })
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Payment processing failed'
        toast.error(errorMessage)
      }
    }
  )

  const handleCardInputChange = (field, value) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handlePayment = async (e) => {
    e?.preventDefault()
    
    if (!bookingId) {
      toast.error('No booking ID found')
      return
    }

    // Validate payment method
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    // Validate card details if card payment is selected
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
        toast.error('Please fill in all card details')
        return
      }
    }

    // Prepare payment data according to backend contract
    const paymentData = {
      paymentMethod
    }

    // Add card details if payment method is card-based
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      paymentData.cardNumber = cardDetails.cardNumber.replace(/\s+/g, '')
      paymentData.expiryDate = cardDetails.expiryDate
      paymentData.cvv = cardDetails.cvv
      paymentData.cardholderName = cardDetails.cardholderName
    }

    // Process payment
    processPayment(paymentData)
  }

  if (!bookingId || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Booking Found</h2>
          <p className="text-gray-600 mb-4">Please start from venue selection.</p>
          <button
            onClick={() => navigate('/venues')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Venues
          </button>
        </div>
      </div>
    )
  }

  // Use booking data for display
  const displayData = bookingData || {}
  const serviceFee = 2.00
  const finalTotal = (totalAmount || 0) + serviceFee

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Payment Gateway</h1>
          <p className="text-gray-600 mt-2">Complete your payment securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
              
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === 'credit_card' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <CreditCard className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium text-center">Credit Card</p>
                      </div>
                    </label>
                    
                    <label className="relative">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="debit_card"
                        checked={paymentMethod === 'debit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === 'debit_card' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <CreditCard className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium text-center">Debit Card</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card Details */}
                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardInputChange('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => handleCardInputChange('expiryDate', formatExpiryDate(e.target.value))}
                          placeholder="MM/YY"
                          maxLength="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="123"
                          maxLength="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">Secure Payment</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your payment information is encrypted and secure. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{finalTotal.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{displayData.venue?.name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Court:</span>
                  <span className="font-medium">{displayData.court?.name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{displayData.date || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {displayData.timeSlot?.startTime || displayData.startTime || 'N/A'} - {displayData.timeSlot?.endTime || displayData.endTime || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{displayData.duration || 1} hour(s)</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Court Fee:</span>
                  <span className="font-medium">₹{(totalAmount || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-medium">₹{serviceFee.toFixed(2)}</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentGatewayPage
