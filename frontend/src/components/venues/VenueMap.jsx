import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

// Simple static map component to avoid Leaflet conflicts
const StaticMap = ({ venue, height = '300px' }) => {
  const [coordinates, setCoordinates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Function to geocode address to coordinates
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
      return null
    } catch (error) {
      // Silently handle geocoding errors
      return null
    }
  }

  useEffect(() => {
    const getCoordinates = async () => {
      if (!venue) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Check if venue has coordinates
      if (venue.coordinates && venue.coordinates.lat && venue.coordinates.lng) {
        setCoordinates({
          lat: venue.coordinates.lat,
          lng: venue.coordinates.lng
        })
        setLoading(false)
        return
      }

      // If no coordinates, try to geocode the address
      const address = venue.address || venue.shortLocation
      if (address) {
        const coords = await geocodeAddress(address)
        if (coords) {
          setCoordinates(coords)
        } else {
          // Fallback to a default location
          setCoordinates({ lat: 40.7128, lng: -74.0060 })
          setError('Could not find exact location. Showing approximate area.')
        }
      } else {
        setError('No address available for this venue.')
      }
      setLoading(false)
    }

    getCoordinates()
  }, [venue])

  if (!venue) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600 text-sm">No venue data available</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error && !coordinates) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Generate static map URL using OpenStreetMap static map service
  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01},${coordinates.lat - 0.01},${coordinates.lng + 0.01},${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`
    : null

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      {error && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}

      {coordinates ? (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center h-full relative">
          {/* Simple visual map representation */}
          <div className="text-center p-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-primary-200">
                <MapPin className="w-8 h-8 text-primary-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-700 font-medium mb-1">{venue.name}</p>
            <p className="text-gray-600 text-sm mb-3">{venue.address || venue.shortLocation}</p>
            <div className="text-xs text-gray-500 bg-white bg-opacity-70 rounded px-2 py-1 inline-block">
              📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
            {coordinates && (
              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 flex items-center justify-center h-full">
          <div className="text-center p-4">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Unable to load map</p>
            <p className="text-gray-500 text-xs mt-1">{venue.address || venue.shortLocation}</p>
          </div>
        </div>
      )}

      {/* Venue info overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 rounded px-3 py-2 text-sm">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900 truncate">{venue.name}</p>
            <p className="text-gray-600 text-xs truncate">{venue.address || venue.shortLocation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Use the static map component to avoid Leaflet conflicts
const VenueMap = StaticMap

export default VenueMap
