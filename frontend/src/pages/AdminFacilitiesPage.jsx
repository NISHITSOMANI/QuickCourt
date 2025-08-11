import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Building2, 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { venueApi } from '../api/venueApi'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'

const AdminFacilitiesPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  // Fetch all venues for admin
  const { data, isLoading, error } = useQuery(
    ['admin-facilities', currentPage, statusFilter, searchQuery],
    () => venueApi.getVenues({
      page: currentPage,
      limit: 10,
      status: statusFilter,
      search: searchQuery,
      admin: true
    }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  )

  // Approve/Reject venue mutation
  const updateVenueStatusMutation = useMutation(
    ({ venueId, status }) => venueApi.updateVenueStatus(venueId, status),
    {
      onSuccess: () => {
        toast.success('Venue status updated successfully')
        queryClient.invalidateQueries('admin-facilities')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update venue status')
      }
    }
  )

  const handleStatusUpdate = (venueId, status) => {
    const action = status === 'approved' ? 'approve' : 'reject'
    if (window.confirm(`Are you sure you want to ${action} this venue?`)) {
      updateVenueStatusMutation.mutate({ venueId, status })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'suspended':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Facility Management</h1>
          <p className="text-gray-600 mt-2">Review and manage venue applications and listings</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Venues
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex items-end">
              {(statusFilter || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Facilities List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Error loading facilities. Please try again.</p>
            </div>
          ) : data?.venues?.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
              <p className="text-gray-500">No facilities match your current filters.</p>
            </div>
          ) : (
            <>
              {data?.venues?.map((venue) => (
                <div key={venue._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col lg:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {venue.name}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(venue.status)}`}>
                              {venue.status || 'pending'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{venue.description}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{venue.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Owner:</span>
                          <p>{venue.owner?.name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Sports:</span>
                          <p>{venue.sports?.join(', ')}</p>
                        </div>
                        <div>
                          <span className="font-medium">Courts:</span>
                          <p>{venue.courtCount || 0} courts</p>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{venue.rating?.toFixed(1) || '0.0'} ({venue.reviewCount || 0})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700">
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>

                        {venue.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(venue._id, 'approved')}
                              disabled={updateVenueStatusMutation.isLoading}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(venue._id, 'rejected')}
                              disabled={updateVenueStatusMutation.isLoading}
                              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {venue.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(venue._id, 'suspended')}
                            disabled={updateVenueStatusMutation.isLoading}
                            className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Suspend</span>
                          </button>
                        )}

                        {venue.status === 'suspended' && (
                          <button
                            onClick={() => handleStatusUpdate(venue._id, 'approved')}
                            disabled={updateVenueStatusMutation.isLoading}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

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
  )
}

export default AdminFacilitiesPage
