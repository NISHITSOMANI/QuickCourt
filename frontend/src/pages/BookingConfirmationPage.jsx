import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from 'react-query'
import { ArrowLeft, Clock, MapPin, Calendar, Users, DollarSign, CheckCircle } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import { useAuth } from '../../context/AuthContext'
import { bookingApi } from '../../api/bookingApi'
import toast from 'react-hot-toast'

const BookingConfirmationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectedVenue, selectedCourt } = useBooking()
  
  // Get booking data from navigation state or booking context
  const bookingData = location.state?.bookingData || {
    venue: selectedVenue,
    court: selectedCourt,
    ...location.state
  }
  
  useEffect(() => {
    console.log('BookingConfirmationPage loaded successfully')
    console.log('Booking data received:', bookingData)
    console.log('Location state:', location.state)

    // Redirect if no booking data
    if (!bookingData || !bookingData.venue || !bookingData.court) {
      console.log('No booking data found')
      toast.error('No booking data found. Please start from venue selection.')
      navigate('/venues')
      return
    }
  }, [bookingData, navigate, location.state])

  // Create booking mutation
  const { mutate: createBooking, isLoading: isSubmittingBooking } = useMutation(
    async (bookingData) => {
      try {
        const response = await bookingApi.createBooking(bookingData)
        return response.data
      } catch (error) {
        console.error('Booking creation failed:', error)
        throw error
      }
    },
    {
      onSuccess: (data) => {
        toast.success('Booking created successfully!')
        // Navigate to payment gateway with booking ID
        navigate('/payment-gateway', { 
          state: { 
            bookingId: data.booking?._id || data._id,
            bookingData: data.booking || data,
            totalAmount: data.booking?.totalAmount || data.totalAmount
          } 
        })
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to create booking'
        toast.error(errorMessage)
      }
    }
  )

  const handleConfirmBooking = async () => {
    if (!bookingData) {
      toast.error('No booking data found')
      return
    }

    if (!user) {
      toast.error('Please log in to make a booking')
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    // Create the booking first, then proceed to payment
    createBooking(bookingData)
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Booking Confirmation</h1>
          <p className="text-gray-600 mt-2">Review your booking details before proceeding to payment</p>
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
              
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full mt-6 py-3 px-4 rounded-md font-medium transition-colors ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay $${finalTotal.toFixed(2)}`
                )}
              </button>
              
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
