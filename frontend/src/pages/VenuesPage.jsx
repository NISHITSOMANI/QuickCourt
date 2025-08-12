import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, SlidersHorizontal, Grid, List } from 'lucide-react'
import VenueCard from '../components/venues/VenueCard'
import FilterPanel from '../components/common/FilterPanel'
import Pagination from '../components/common/Pagination'
import venueApi from '../api/venueApi'

const VenuesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    sport: searchParams.get('sport') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    rating: searchParams.get('rating') || '',
    venueType: searchParams.get('venueType') || '',
    sports: searchParams.get('sports')?.split(',').filter(Boolean) || [],
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
  })
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating')

  // Build query parameters for API call
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      limit: 12,
      sort: sortBy,
    }

    if (searchQuery) params.q = searchQuery
    if (filters.location) params.location = filters.location
    if (filters.sport) params.sportType = filters.sport
    if (filters.priceMin) params.priceMin = filters.priceMin
    if (filters.priceMax) params.priceMax = filters.priceMax
    if (filters.rating) params.rating = filters.rating
    if (filters.venueType) params.venueType = filters.venueType
    if (filters.sports?.length) params.sports = filters.sports.join(',')
    if (filters.amenities?.length) params.amenities = filters.amenities.join(',')

    return params
  }

  // Fetch venues with enhanced error handling and data mapping
  const { 
    data: venuesData, 
    isLoading, 
    isError, 
    error: venuesError,
    isPreviousData 
  } = useQuery(
    ['venues', buildQueryParams()],
    async () => {
      try {
        const response = await venueApi.getVenues(buildQueryParams())
        // Normalize the response data structure
        return {
          venues: Array.isArray(response?.data?.venues) 
            ? response.data.venues 
            : Array.isArray(response?.data)
              ? response.data
              : [],
          total: response?.data?.total || 0,
          totalPages: response?.data?.totalPages || 1,
          currentPage: response?.data?.currentPage || 1
        }
      } catch (error) {
        console.error('Error fetching venues:', error)
        throw error
      }
    },
    {
      select: (response) => ({
        venues: response.venues || [],
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage
      }),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch venues:', error)
      }
    }
  )

  // Extract normalized data
  const { venues = [], total = 0, totalPages = 1, currentPage: currentPageFromApi = 1 } = venuesData || {}

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('q', searchQuery)
    if (filters.location) params.set('location', filters.location)
    if (filters.sport) params.set('sport', filters.sport)
    if (filters.priceMin) params.set('priceMin', filters.priceMin)
    if (filters.priceMax) params.set('priceMax', filters.priceMax)
    if (filters.rating) params.set('rating', filters.rating)
    if (filters.venueType) params.set('venueType', filters.venueType)
    if (filters.sports?.length) params.set('sports', filters.sports.join(','))
    if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','))
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (sortBy !== 'rating') params.set('sort', sortBy)

    setSearchParams(params)
  }, [filters, currentPage, sortBy, searchQuery, setSearchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      location: '',
      sport: '',
      priceMin: '',
      priceMax: '',
      rating: '',
      venueType: '',
      sports: [],
      amenities: [],
    })
    setSearchQuery('')
    setCurrentPage(1)
  }

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'newest', label: 'Newest First' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <FilterPanel 
              filters={filters}
              onChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Sports Venues</h1>
            </div>
            
            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-500'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-500'}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="md:hidden p-2 text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    const filters = document.getElementById('filters');
                    if (filters) filters.classList.toggle('hidden');
                  }}
                  title="Filters"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Loading State */}
            {isLoading && !isPreviousData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80" />
                ))}
              </div>
            )}
            
            {/* Empty State */}
            {!isLoading && !isError && venues.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No venues found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
                <button
                  onClick={handleClearFilters}
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
            
            {/* Venues Grid/List */}
            {!isLoading && !isError && venues.length > 0 && (
              <>
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                  {venues.map((venue) => {
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
                    return (
                      <VenueCard 
                        key={venueData._id} 
                        venue={venueData} 
                        viewMode={viewMode} 
                      />
                    )
                  })}
                </div>
                
                {/* Pagination */}
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPageFromApi}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="flex justify-center"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenuesPage
