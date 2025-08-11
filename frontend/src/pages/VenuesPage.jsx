import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, SlidersHorizontal, Grid, List } from 'lucide-react'
import VenueCard from '../components/VenueCard'
import FilterPanel from '../components/FilterPanel'
import Pagination from '../components/Pagination'
import { venueApi } from '../api/venueApi'

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

  // Fetch venues
  const { data, isLoading, error } = useQuery(
    ['venues', buildQueryParams()],
    () => venueApi.getVenues(buildQueryParams()),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  )

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Sports Venues</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search venues, sports, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {data && (
                <span className="text-sm text-gray-600">
                  {data.total} venues found
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Page {currentPage} of {data?.totalPages || 1}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Error loading venues. Please try again.</p>
              </div>
            ) : data?.venues?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No venues found matching your criteria.</p>
                <button
                  onClick={handleClearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters and try again
                </button>
              </div>
            ) : (
              <>
                {/* Venues Grid/List */}
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-6'
                  }
                `}>
                  {data?.venues?.map((venue) => (
                    <VenueCard 
                      key={venue._id} 
                      venue={venue}
                      className={viewMode === 'list' ? 'flex' : ''}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data?.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={data.totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenuesPage
