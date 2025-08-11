import { Link } from 'react-router-dom'
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Users,
  Wifi,
  Car,
  Coffee,
  Shield
} from 'lucide-react'

const VenueCard = ({ venue, className = '' }) => {
  const {
    _id,
    name,
    description,
    address,
    shortLocation,
    images = [],
    sports = [],
    startingPrice,
    rating = 0,
    reviewCount = 0,
    amenities = [],
    operatingHours,
  } = venue

  const getAmenityIcon = (amenity) => {
    const iconMap = {
      wifi: Wifi,
      parking: Car,
      cafeteria: Coffee,
      security: Shield,
    }
    return iconMap[amenity.toLowerCase()] || Users
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < Math.floor(rating)
          ? 'text-yellow-400 fill-current'
          : 'text-gray-300'
          }`}
      />
    ))
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-md">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(startingPrice)}/hr
            </span>
          </div>
        </div>

        {/* Sports Tags */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {sports.slice(0, 2).map((sport, index) => (
            <span
              key={index}
              className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full"
            >
              {sport}
            </span>
          ))}
          {sports.length > 2 && (
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              +{sports.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{shortLocation || address}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-1">
            {renderStars(rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {description}
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            {amenities.slice(0, 4).map((amenity, index) => {
              const IconComponent = getAmenityIcon(amenity)
              return (
                <div
                  key={index}
                  className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full"
                  title={amenity}
                >
                  <IconComponent className="w-3 h-3 text-gray-600" />
                </div>
              )
            })}
            {amenities.length > 4 && (
              <span className="text-xs text-gray-500">
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Operating Hours */}
        {operatingHours && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {operatingHours.open} - {operatingHours.close}
            </span>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/venues/${_id}`}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors text-center block"
        >
          View Details & Book
        </Link>
      </div>
    </div>
  )
}

export default VenueCard
