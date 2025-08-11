import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  MapPin, 
  Star, 
  Calendar,
  DollarSign,
  Clock,
  Trash2,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { userApi } from '../api/dashboardApi'
import toast from 'react-hot-toast'

const UserFavoritesPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const queryClient = useQueryClient()

  // Mock data - replace with actual API calls when backend is ready
  const mockFavorites = {
    favorites: [
      {
        id: '1',
        venueId: 'venue_1',
        name: 'Sports Complex A',
        location: 'Downtown, City Center',
        sport: 'Badminton',
        rating: 4.8,
        priceRange: '$40-60/hour',
        image: '/api/placeholder/300/200',
        totalBookings: 8,
        lastVisit: '2024-01-10',
        amenities: ['Parking', 'Changing Room', 'Water'],
        distance: '2.5 km',
        availability: 'Available Today'
      },
      {
        id: '2',
        venueId: 'venue_2',
        name: 'Tennis Club B',
        location: 'Uptown, Sports District',
        sport: 'Tennis',
        rating: 4.6,
        priceRange: '$60-80/hour',
        image: '/api/placeholder/300/200',
        totalBookings: 5,
        lastVisit: '2024-01-08',
        amenities: ['Parking', 'Pro Shop', 'Cafe'],
        distance: '4.2 km',
        availability: 'Available Tomorrow'
      },
      {
        id: '3',
        venueId: 'venue_3',
        name: 'Fitness Center C',
        location: 'Midtown, Business Area',
        sport: 'Squash',
        rating: 4.7,
        priceRange: '$50-70/hour',
        image: '/api/placeholder/300/200',
        totalBookings: 3,
        lastVisit: '2024-01-05',
        amenities: ['Gym', 'Sauna', 'Parking'],
        distance: '1.8 km',
        availability: 'Fully Booked Today'
      }
    ]
  }

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation(
    (venueId) => userApi.removeFromFavorites(venueId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-favorites')
        toast.success('Removed from favorites')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove from favorites')
      }
    }
  )

  const handleRemoveFromFavorites = (venueId, venueName) => {
    if (window.confirm(`Remove "${venueName}" from your favorites?`)) {
      removeFromFavoritesMutation.mutate(venueId)
    }
  }

  const filteredFavorites = mockFavorites.favorites.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = !sportFilter || venue.sport === sportFilter
    return matchesSearch && matchesSport
  })

  const getAvailabilityColor = (availability) => {
    if (availability.includes('Available')) {
      return 'text-green-600 bg-green-100'
    } else if (availability.includes('Tomorrow')) {
      return 'text-yellow-600 bg-yellow-100'
    } else {
      return 'text-red-600 bg-red-100'
    }
  }

  const getSportIcon = (sport) => {
    // You can add sport-specific icons here
    return <Calendar className="w-4 h-4" />
  }

  return (
    <DashboardLayout 
      title="Favorite Venues" 
      subtitle="Quick access to your preferred sports venues"
    >
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sport Filter */}
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sports</option>
            <option value="Badminton">Badminton</option>
            <option value="Tennis">Tennis</option>
            <option value="Basketball">Basketball</option>
            <option value="Squash">Squash</option>
            <option value="Football">Football</option>
          </select>

          {/* Add to Favorites Button */}
          <Link
            to="/venues"
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Find More Venues
          </Link>
        </div>
      </div>

      {/* Favorites Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{mockFavorites.favorites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockFavorites.favorites.reduce((sum, venue) => sum + venue.totalBookings, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {(mockFavorites.favorites.reduce((sum, venue) => sum + venue.rating, 0) / mockFavorites.favorites.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Grid */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Venue Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleRemoveFromFavorites(venue.venueId, venue.name)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(venue.availability)}`}>
                    {venue.availability}
                  </span>
                </div>
              </div>

              {/* Venue Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-700">{venue.rating}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {venue.location} • {venue.distance}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    {getSportIcon(venue.sport)}
                    <span className="ml-2">{venue.sport}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {venue.priceRange}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Bookings:</span>
                    <span className="ml-1 font-medium">{venue.totalBookings}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last visit:</span>
                    <span className="ml-1 font-medium">{venue.lastVisit}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {venue.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {venue.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{venue.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/venues/${venue.venueId}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors text-center"
                  >
                    Book Now
                  </Link>
                  <Link
                    to={`/venues/${venue.venueId}`}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || sportFilter 
              ? "No venues match your current filters. Try adjusting your search criteria."
              : "You haven't added any venues to your favorites yet. Start exploring and save your preferred venues!"
            }
          </p>
          <Link
            to="/venues"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Discover Venues
          </Link>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UserFavoritesPage
