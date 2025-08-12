import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Clock, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookingApi';
import toast from 'react-hot-toast';
import { ButtonLoader, PageLoader } from '../components/common/LoadingSpinner';

const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectedVenue, selectedCourt } = useBooking()

  // Get booking data from navigation state
  const bookingData = location.state?.bookingData;

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      toast.error('No booking data found. Please start over.');
      navigate('/venues');
    }
  }, [bookingData, navigate]);

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('PaymentPage loaded successfully')
    console.log('Booking data received:', bookingData)
    console.log('Location state:', location.state)

    // Don't redirect if no booking data for now - just show a message
    if (!bookingData) {
      console.log('No booking data found')
      // toast.error('No booking data found')
      // navigate('/booking')
      // return
    }
  }, [bookingData, navigate, location.state])

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

  const handlePayment = async () => {
    if (!bookingData) {
      toast.error('No booking data found')
      return
    }

    // Validate payment method
    if (!paymentMethod) {
    }

    setPaymentStatus('processing');
    setError(null);

    try {
      // Process payment through API
      const response = await bookingApi.processPayment({
        bookingId: bookingData._id,
        amount: bookingData.totalAmount,
        paymentMethod,
        cardDetails
      });

      // Update state for success
      setPaymentStatus('success');
      toast.success('Payment successful!');

      // Redirect to booking confirmation after a short delay
      setTimeout(() => {
        navigate('/booking-confirmation', {
          state: { booking: response.data.booking }
        });
      }, 1500);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setError(error.response?.data?.message || 'Payment failed. Please try again.');
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    }
  }

  // Show loading state if no booking data
  if (!bookingData) {
    return <PageLoader message="Loading booking details..." />;
  }

  // Show payment processing state
  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="flex justify-center mb-6">
            <ButtonLoader />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we process your payment. Do not refresh or close this page.</p>
        </div>
      </div>
    );
  }

  // Show payment success state
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to booking confirmation...</p>
        </div>
      </div>
    );
  }

  // Show payment error state
  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{error || 'An error occurred while processing your payment.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentStatus('idle')}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use booking data or fallback data for testing
  const displayData = bookingData || {
    venue: { name: 'Test Venue', location: 'Test Location' },
    court: { name: 'Test Court', pricePerHour: 50 },
    date: '2024-01-15',
    timeSlot: { startTime: '10:00', endTime: '11:00' },
    duration: 1,
    totalAmount: 50
  }

  const totalAmount = displayData.totalAmount || 0
  const serviceFee = 2.00
  const finalTotal = totalAmount + serviceFee

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
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600 mt-2">Complete your booking payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <input
                    id="card"
                    name="paymentMethod"
                    type="radio"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="card" className="ml-3 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                    <span className="text-gray-900 font-medium">Credit/Debit Card</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="upi"
                    name="paymentMethod"
                    type="radio"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="upi" className="ml-3 flex items-center">
                    <span className="w-5 h-5 mr-2 text-gray-600">💳</span>
                    <span className="text-gray-900 font-medium">UPI</span>
                  </label>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* UPI Details */}
              {paymentMethod === 'upi' && (
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-4">
                    You will be redirected to your UPI app to complete the payment
                  </div>
                  <div className="text-sm text-gray-500">
                    Supported: Google Pay, PhonePe, Paytm, BHIM
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mt-1 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{displayData.venue.name}</p>
                    <p className="text-sm text-gray-600">{displayData.court.name}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-900">{new Date(displayData.date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-900">
                    {displayData.timeSlot.startTime} - {displayData.timeSlot.endTime}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${totalAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="text-gray-900">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handlePayment}>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isProcessing
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                    } flex items-center justify-center`}
                >
                  {isProcessing ? <ButtonLoader /> : `Pay $${finalTotal.toFixed(2)}`}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Your payment is secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
