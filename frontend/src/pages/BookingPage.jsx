import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  ArrowLeft, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import { bookingApi } from '../api/bookingApi'
import venueApi from '../api/venueApi'
import { format } from 'date-fns'

const BookingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { venueId, courtId } = useParams()
  const { selectedVenue, selectedCourt, setVenue, setCourt } = useBooking()

  // Authentication check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to make a booking');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    // Role check - only users can make bookings
    if (user?.role !== 'user') {
      toast.error('Only registered users can make bookings');
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, navigate]);
  
  // Form state
  const [selectedVenueId, setSelectedVenueId] = useState(selectedVenue?._id || venueId || '')
  const [selectedCourtId, setSelectedCourtId] = useState(selectedCourt?._id || courtId || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState('1')
  const [bookingNotes, setBookingNotes] = useState('')
  
  // Auto-select venue/court from URL params if available
  useEffect(() => {
    if (venueId && selectedVenue?._id !== venueId) {
      setSelectedVenueId(venueId)
    }
    if (courtId && selectedCourt?._id !== courtId) {
      setSelectedCourtId(courtId)
    }
  }, [venueId, courtId, selectedVenue, selectedCourt])

  // Fetch venues with error handling
  const { 
    data: venues = [], 
    isLoading: isLoadingVenues, 
    error: venuesError 
  } = useQuery(
    ['venues', 'booking'],
    async () => {
      try {
        const response = await venueApi.getVenues({ limit: 100 })
        return response.data?.venues || []
      } catch (error) {
        console.error('Error fetching venues:', error)
        toast.error('Failed to load venues. Please try again.')
        throw error
      }
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Venues query error:', error)
      }
    }
  )

  // Fetch courts for selected venue with error handling
  const { 
    data: courts = [], 
    isLoading: isLoadingCourts, 
    error: courtsError 
  } = useQuery(
    ['venue-courts', selectedVenueId],
    async () => {
      if (!selectedVenueId) return []
      try {
        const response = await venueApi.getVenueCourts(selectedVenueId)
        return response.data?.courts || []
      } catch (error) {
        console.error('Error fetching courts:', error)
        toast.error('Failed to load courts. Please try again.')
        throw error
      }
    },
    {
      enabled: !!selectedVenueId,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Courts query error:', error)
      }
    }
  )

  // Generate time slots from 6:00 AM to 10:00 PM
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      slots.push(time)
    }
    return slots
  }
  
  const timeSlots = generateTimeSlots()
  
  // Calculate end time based on selected time and duration
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return ''
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + (parseInt(duration) * 60 * 60 * 1000))
    return format(endDate, 'HH:mm')
  }

  const handleVenueChange = (venueId) => {
    setSelectedVenueId(venueId)
    setSelectedCourtId('')
    const venue = venues?.find(v => v._id === venueId)
    if (venue) {
      setVenue(venue)
    }
  }

  const handleCourtChange = (courtId) => {
    setSelectedCourtId(courtId)
    const court = courts?.find(c => c._id === courtId)
    if (court) {
      setCourt(court)
    }
  }

  const calculateTotalAmount = () => {
    if (!selectedCourtId || !duration) return 0
    const court = courts?.find(c => c._id === selectedCourtId)
    return court ? court.pricePerHour * parseInt(duration) : 0
  }

  // Handle booking submission
  const { mutate: createBooking, isLoading: isSubmitting } = useMutation(
    async (bookingData) => {
      try {
        const response = await bookingApi.createBooking(bookingData)
        return response.data
      } catch (error) {
        console.error('Booking failed:', error)
        throw error
      }
    },
    {
      onSuccess: (data) => {
        toast.success('Booking successful!')
        // Redirect to booking confirmation or user's bookings page
        navigate('/my-bookings')
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to create booking'
        toast.error(errorMessage)
      }
    }
  )

  const handleBooking = async (e) => {
    e?.preventDefault()
    
    // Critical authentication check
    if (!isAuthenticated) {
      toast.error('Please login to make a booking');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // Role-based authorization check
    if (user?.role !== 'user') {
      toast.error('Only registered users can make bookings');
      navigate('/unauthorized');
      return;
    }
    
    // Comprehensive form validation
    if (!selectedVenueId || !selectedCourtId || !selectedDate || !selectedTime || !duration) {
      toast.error('Please fill in all required fields')
      return
    }

    // Date validation - prevent past bookings
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    if (selectedDateTime <= now) {
      toast.error('Cannot book for past dates or times');
      return;
    }

    // Duration validation
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 8) {
      toast.error('Duration must be between 1-8 hours');
      return;
    }
    
    const selectedCourt = courts.find(c => c._id === selectedCourtId)
    if (!selectedCourt) {
      toast.error('Selected court not found')
      return
    }
    
    const selectedVenue = venues?.find(v => v._id === selectedVenueId)
    if (!selectedVenue) {
      toast.error('Selected venue not found')
      return
    }

    // Venue operating hours validation
    if (selectedVenue.operatingHours) {
      const bookingTime = selectedTime;
      const openTime = selectedVenue.operatingHours.open;
      const closeTime = selectedVenue.operatingHours.close;
      
      if (bookingTime < openTime || bookingTime > closeTime) {
        toast.error(`Venue operates from ${openTime} to ${closeTime}`);
        return;
      }
    }
    
    const startTime = new Date(`${selectedDate}T${selectedTime}`)
    const endTime = new Date(startTime.getTime() + (parseInt(duration) * 60 * 60 * 1000))
    
    // Prepare booking data according to the backend's BookingCreate schema
    const bookingData = {
      venue: selectedVenueId,
      court: selectedCourtId,
      date: selectedDate,
      startTime: selectedTime,
      endTime: calculateEndTime(selectedTime, duration),
      // Optional fields
      notes: bookingNotes || undefined, // Only include if not empty
      // The following fields will be set by the backend
      // - status
      // - paymentStatus
      // - totalAmount
      // - user (from auth token)
      // - createdAt
      // - updatedAt
    }
    
    // Submit booking
    createBooking(bookingData)
  }

  const today = new Date().toISOString().split('T')[0]

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
          <h1 className="text-3xl font-bold text-gray-900">Court Booking</h1>
          <p className="text-gray-600 mt-2">Book your preferred court and time slot</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Venue Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Select Venue
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a venue...</option>
                  {venues?.map((venue) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name} - {venue.shortLocation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sport Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Badminton</option>
                  <option>Tennis</option>
                  <option>Basketball</option>
                  <option>Football</option>
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </div>

              {/* Court Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Court
                </label>
                <select
                  value={selectedCourtId}
                  onChange={(e) => handleCourtChange(e.target.value)}
                  disabled={!selectedVenueId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a court...</option>
                  {courts?.map((court) => (
                    <option key={court._id} value={court._id}>
                      {court.name} - ${court.pricePerHour}/hour
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">
                    {venues?.find(v => v._id === selectedVenueId)?.name || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Court:</span>
                  <span className="font-medium">
                    {courts?.find(c => c._id === selectedCourtId)?.name || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate || 'Not selected'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {selectedTime ? `${selectedTime} - ${calculateEndTime(selectedTime, duration)}` : 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{duration} hour(s)</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">
                    <DollarSign className="w-4 h-4 inline" />
                    {calculateTotalAmount()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!selectedVenueId || !selectedCourtId || !selectedDate || !selectedTime}
                className={`w-full mt-6 py-3 px-4 rounded-md font-medium transition-colors ${
                  selectedVenueId && selectedCourtId && selectedDate && selectedTime
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
