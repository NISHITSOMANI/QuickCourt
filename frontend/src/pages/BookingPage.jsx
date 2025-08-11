import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Calendar, Clock, MapPin, Users, DollarSign, ArrowLeft } from 'lucide-react'
import { useBooking } from '../context/BookingContext'
import { venueApi } from '../api/venueApi'
import toast from 'react-hot-toast'

const BookingPage = () => {
  const navigate = useNavigate()
  const { selectedVenue, selectedCourt, setVenue, setCourt } = useBooking()
  
  const [selectedVenueId, setSelectedVenueId] = useState(selectedVenue?._id || '')
  const [selectedCourtId, setSelectedCourtId] = useState(selectedCourt?._id || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState('1')

  // Fetch venues
  const { data: venues } = useQuery(
    'venues-for-booking',
    () => venueApi.getVenues({ limit: 100 }),
    {
      select: (response) => response.data.venues || [],
    }
  )

  // Fetch courts for selected venue
  const { data: courts } = useQuery(
    ['venue-courts', selectedVenueId],
    () => venueApi.getVenueCourts(selectedVenueId),
    {
      select: (response) => response.data.courts || [],
      enabled: !!selectedVenueId,
    }
  )

  // Get available time slots
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ]

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

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = hours + parseInt(duration)
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const calculateTotalAmount = () => {
    if (!selectedCourtId || !duration) return 0
    const court = courts?.find(c => c._id === selectedCourtId)
    return court ? court.pricePerHour * parseInt(duration) : 0
  }

  const handleBooking = () => {
    if (!selectedVenueId || !selectedCourtId || !selectedDate || !selectedTime) {
      toast.error('Please fill in all booking details')
      return
    }

    // Prepare booking data for payment page
    const venue = venues?.find(v => v._id === selectedVenueId)
    const court = courts?.find(c => c._id === selectedCourtId)

    const bookingData = {
      venueId: selectedVenueId,
      courtId: selectedCourtId,
      date: selectedDate,
      startTime: selectedTime,
      endTime: calculateEndTime(selectedTime, duration),
      duration: parseInt(duration),
      totalAmount: calculateTotalAmount(),
      venue: {
        _id: venue?._id,
        name: venue?.name,
        location: venue?.shortLocation || venue?.address
      },
      court: {
        _id: court?._id,
        name: court?.name,
        pricePerHour: court?.pricePerHour
      },
      timeSlot: {
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, duration)
      }
    }

    // Navigate to payment page with booking data
    navigate('/payment', { state: { bookingData } })
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
