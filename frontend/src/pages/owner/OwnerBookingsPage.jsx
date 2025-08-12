import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  MapPin,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { bookingApi } from '../../api/bookingApi'
import venueApi from '../../api/venueApi'
import { ownerApi } from '../../api/dashboardApi'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

const OwnerBookingsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const queryClient = useQueryClient()

  // Fetch owner venues
  const { data: venues } = useQuery(
    'owner-venues',
    () => venueApi.getVenues({ owner: true }),
    {
      select: (response) => response.data.venues || [],
    }
  )

  // Fetch bookings
  const { data, isLoading, error } = useQuery(
    ['owner-bookings', currentPage, statusFilter, venueFilter, dateFilter],
    () => bookingApi.getVenueBookings(venueFilter || 'all', {
      page: currentPage,
      limit: 10,
      status: statusFilter,
      dateFrom: dateFilter,
    }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  )

  // Update booking status mutation
  const updateBookingMutation = useMutation(
    ({ bookingId, status }) => bookingApi.updateBookingStatus(bookingId, status),
    {
      onSuccess: () => {
        toast.success('Booking status updated successfully')
        queryClient.invalidateQueries('owner-bookings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update booking')
      }
    }
  )

  const handleStatusUpdate = (bookingId, status) => {
    updateBookingMutation.mutate({ bookingId, status })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      case 'completed':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const clearFilters = () => {
    setStatusFilter('')
    setVenueFilter('')
    setDateFilter('')
    setCurrentPage(1)
  }

  return (
    <DashboardLayout
      title="Venue Bookings"
      subtitle="Manage bookings for your venues"
    >
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                <option value="">All Venues</option>
              {venues?.map((venue) => (
                <option key={venue._id} value={venue._id}>
                  {venue.name}
                </option>
              ))}
            </select>
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end">
            {(statusFilter || venueFilter || dateFilter) && (
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

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Error loading bookings. Please try again.</p>
          </div>
        ) : data?.bookings?.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">No bookings match your current filters.</p>
          </div>
        ) : (
            <>
              {data?.bookings?.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col lg:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.venue?.name}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {booking.court?.name} - {booking.court?.sportType}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{booking.user?.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-semibold">${booking.totalAmount}</span>
                        </div>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                            disabled={updateBookingMutation.isLoading}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                            disabled={updateBookingMutation.isLoading}
                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
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
    </DashboardLayout>
  )
}

export default OwnerBookingsPage
