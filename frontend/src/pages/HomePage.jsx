import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Search,
  MapPin,
  Clock,
  Star,
  Users,
  Calendar,
  Shield,
  Zap,
  Heart
} from 'lucide-react'
import SearchBar from '../components/common/SearchBar'
import VenueCard from '../components/venues/VenueCard'
import SportsCategories from '../components/common/SportsCategories'
import { venueApi } from '../api/venueApi'

const HomePage = () => {
  const navigate = useNavigate()

  // Fetch popular venues with proper error handling
  const { 
    data: popularVenues, 
    isLoading: loadingVenues, 
    error: venuesError 
  } = useQuery(
    'popularVenues',
    async () => {
      try {
        const response = await venueApi.getPopularVenues(6)
        // Ensure the response matches the expected format
        return {
          venues: Array.isArray(response?.data?.venues) 
            ? response.data.venues 
            : Array.isArray(response?.data)
              ? response.data
              : []
        }
      } catch (error) {
        console.error('Error fetching popular venues:', error)
        throw error
      }
    },
    {
      select: (response) => response.venues || [],
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Handle error state
  if (venuesError && !popularVenues?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to load venues
          </h2>
          <p className="text-gray-600 mb-4">
            {venuesError.message || 'Please try again later'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const handleSearch = (searchData) => {
    const queryParams = new URLSearchParams()

    Object.entries(searchData).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value)
      }
    })

    navigate(`/venues?${queryParams.toString()}`)
  }

  const features = [
    {
      icon: Search,
      title: 'Easy Search',
      description: 'Find courts near you with our smart search filters'
    },
    {
      icon: Calendar,
      title: 'Instant Booking',
      description: 'Book your favorite courts in just a few clicks'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications about your bookings'
    }
  ]

  const stats = [
    { number: '500+', label: 'Sports Venues' },
    { number: '10K+', label: 'Happy Users' },
    { number: '50K+', label: 'Bookings Made' },
    { number: '4.8', label: 'Average Rating' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find & Book Sports Courts
              <span className="block text-primary-200">Near You</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Discover amazing sports venues, book courts instantly, and play your favorite sports with ease.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose QuickCourt?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make it simple to find and book the perfect sports venue for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Venues Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Popular Venues
              </h2>
              <p className="text-gray-600">
                Discover the most loved sports venues in your area
              </p>
            </div>
            <Link
              to="/venues"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>

          {loadingVenues ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80" />
              ))}
            </div>
          ) : popularVenues?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularVenues.map((venue) => {
                // Ensure venue has required fields
                const venueData = {
                  _id: venue._id || venue.id,
                  name: venue.name || 'Unnamed Venue',
                  description: venue.description || '',
                  address: venue.address || 'Address not available',
                  shortLocation: venue.shortLocation || venue.location || 'Location not available',
                  images: Array.isArray(venue.images) ? venue.images : [],
                  sports: Array.isArray(venue.sports) ? venue.sports : [],
                  startingPrice: venue.startingPrice || venue.pricePerHour || 0,
                  rating: venue.rating || 0,
                  reviewCount: venue.reviewCount || 0,
                  amenities: Array.isArray(venue.amenities) ? venue.amenities : [],
                  operatingHours: venue.operatingHours || {}
                }
                return <VenueCard key={venueData._id} venue={venueData} />
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No popular venues found. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* Sports Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SportsCategories />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-200">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Playing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of sports enthusiasts who trust QuickCourt for their venue bookings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/venues"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
            >
              Find Courts
            </Link>
            <Link
              to="/register?role=owner"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-3 rounded-md font-medium transition-colors"
            >
              List Your Venue
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
