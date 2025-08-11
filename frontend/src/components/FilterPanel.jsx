import { useState } from 'react'
import { Filter, X, DollarSign, Star, MapPin } from 'lucide-react'

const FilterPanel = ({ filters, onFiltersChange, onClear, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  const sportOptions = [
    'Basketball',
    'Tennis',
    'Badminton',
    'Football',
    'Volleyball',
    'Squash',
    'Table Tennis',
    'Cricket'
  ]

  const venueTypes = [
    'Indoor',
    'Outdoor',
    'Covered',
    'Multi-purpose'
  ]

  const amenityOptions = [
    'Parking',
    'WiFi',
    'Cafeteria',
    'Changing Rooms',
    'Equipment Rental',
    'Security',
    'Air Conditioning',
    'Lighting'
  ]

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleSportToggle = (sport) => {
    const currentSports = filters.sports || []
    const updatedSports = currentSports.includes(sport)
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport]
    
    handleFilterChange('sports', updatedSports)
  }

  const handleAmenityToggle = (amenity) => {
    const currentAmenities = filters.amenities || []
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity]
    
    handleFilterChange('amenities', updatedAmenities)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.priceMin || filters.priceMax) count++
    if (filters.rating) count++
    if (filters.venueType) count++
    if (filters.sports?.length) count++
    if (filters.amenities?.length) count++
    return count
  }

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={onClear}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Price Range (per hour)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min</label>
              <input
                type="number"
                placeholder="$0"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max</label>
              <input
                type="number"
                placeholder="$200"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Minimum Rating
          </h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={filters.rating === rating.toString()}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-2 flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Venue Type */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Venue Type
          </h4>
          <div className="space-y-2">
            {venueTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="venueType"
                  value={type.toLowerCase()}
                  checked={filters.venueType === type.toLowerCase()}
                  onChange={(e) => handleFilterChange('venueType', e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sports */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sports</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sportOptions.map((sport) => (
              <label key={sport} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(filters.sports || []).includes(sport.toLowerCase())}
                  onChange={() => handleSportToggle(sport.toLowerCase())}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{sport}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Amenities</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {amenityOptions.map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(filters.amenities || []).includes(amenity.toLowerCase())}
                  onChange={() => handleAmenityToggle(amenity.toLowerCase())}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
