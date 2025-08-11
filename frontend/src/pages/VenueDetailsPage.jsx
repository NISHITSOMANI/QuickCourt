import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Wifi,
  Car,
  Coffee,
  Shield,
  Phone,
  Mail
} from 'lucide-react'
import { venueApi } from '../api/venueApi'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import VenueMap from '../components/VenueMap'
import PaymentMethodModal from '../components/PaymentMethodModal'

const VenueDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { setVenue } = useBooking()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [venue, setVenueData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch venue data with manual state management to avoid React Query issues
  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await venueApi.getVenueById(id)
        const venueData = response?.data?.venue || response?.data
        setVenueData(venueData)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenue()
  }, [id])

  // Simplified - no additional queries for now
  const courts = []
  const reviews = []

  const handleBookNow = () => {
    if (!isAuthenticated) {
      // Store venue info and redirect to login page
      setVenue(venue)
      navigate('/login', {
        state: {
          from: `/venues/${id}`,
          action: 'booking',
          venue: venue
        }
      })
      return
    }

    setVenue(venue)
    setShowPaymentModal(true)
  }

  const handlePaymentMethodSelect = (paymentMethod) => {
    // Navigate to booking page with selected venue and payment method
    setShowPaymentModal(false)
    navigate('/booking', {
      state: {
        selectedVenue: venue,
        selectedPaymentMethod: paymentMethod
      }
    })
  }

  const getAmenityIcon = (amenity) => {
    const iconMap = {
      wifi: Wifi,
      parking: Car,
      cafeteria: Coffee,
      security: Shield,
    }
    return iconMap[amenity.toLowerCase()] || Users
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${index < Math.floor(rating)
          ? 'text-yellow-400 fill-current'
          : 'text-gray-300'
          }`}
      />
    ))
  }

  // Simplified rendering logic to prevent glitches
  const renderContent = () => {
    // Always show loading first
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading venue details...</p>
          </div>
        </div>
      )
    }

    // If we have venue data, show it
    if (venue && venue._id && venue.name) {
      return renderVenueDetails()
    }

    // Show error or not found
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? 'Error Loading Venue' : 'Venue Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error ? 'There was an error loading the venue details.' : 'The venue you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate('/venues')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Browse Venues
          </button>
        </div>
      </div>
    )
  }

  const renderVenueDetails = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        <div className="mb-8">
          <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden">
            <img
              src={venue.images?.[0] || '/placeholder-venue.jpg'}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay with venue name */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{venue.name}</h1>
                <p className="text-lg opacity-90">{venue.shortLocation || venue.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {renderStars(venue.rating || 0)}
                  <span className="ml-2 text-gray-600">
                    {venue.rating?.toFixed(1)} ({venue.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{venue.shortLocation || venue.address}</span>
                </div>
              </div>

              {/* Sports Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {venue.sports?.map((sport, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Venue</h2>
              <p className="text-gray-600 leading-relaxed">{venue.description}</p>
            </div>

            {/* Amenities */}
            {venue.amenities?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity)
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700 capitalize">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Courts */}
            {courts?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Available Courts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map((court) => (
                    <div key={court._id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{court.name}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{court.sportType}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>${court.pricePerHour}/hour</span>
                        </div>
                        {court.operatingHours && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{court.operatingHours.open} - {court.operatingHours.close}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Recent Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {review.user?.name?.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{review.user?.name}</span>
                        </div>
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                      )}
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ${venue.startingPrice}
                  <span className="text-lg font-normal text-gray-600">/hour</span>
                </div>
                <p className="text-sm text-gray-600">Starting from</p>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Book Now
              </button>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{venue.address}</span>
                </div>
                {venue.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{venue.phone}</span>
                  </div>
                )}
                {venue.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{venue.email}</span>
                  </div>
                )}
                {venue.operatingHours && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      {venue.operatingHours.open} - {venue.operatingHours.close}
                    </span>
                  </div>
                )}
              </div>

              {/* Venue Map */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Location</h4>
                <VenueMap venue={venue} height="250px" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        totalAmount={venue?.startingPrice}
        bookingDetails={{
          venueName: venue?.name,
          courtName: 'Available courts',
          date: 'To be selected',
          timeSlot: 'To be selected'
        }}
      />
    </div>
  )

  return renderContent()
}

export default VenueDetailsPage
