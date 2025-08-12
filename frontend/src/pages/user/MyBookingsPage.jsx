import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Filter,
  X,
  Star,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'
import { bookingApi } from '../../api/bookingApi'
import { userApi } from '../../api/dashboardApi'
import { useAuth } from '../../context/AuthContext'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

const MyBookingsPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const queryClient = useQueryClient()

  // Critical authentication and authorization checks
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your bookings')
      navigate('/login')
      return
    }

    if (user?.role !== 'user') {
      toast.error('Access denied. Only users can view bookings')
      navigate('/unauthorized')
      return
    }
  }, [isAuthenticated, user, navigate])

  // Fetch user bookings
  const { data, isLoading, error } = useQuery(
    ['my-bookings', currentPage, statusFilter, dateFilter],
    () => bookingApi.getMyBookings({
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

  // Cancel booking mutation
  const cancelBookingMutation = useMutation(
    (bookingId) => bookingApi.cancelBooking(bookingId),
    {
      onSuccess: () => {
        toast.success('Booking cancelled successfully')
        queryClient.invalidateQueries('my-bookings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel booking')
      }
    }
  )

  const handleCancelBooking = (booking) => {
    // Critical validation checks
    if (!booking || !booking._id) {
      toast.error('Invalid booking data')
      return
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      toast.error('This booking is already cancelled')
      return
    }

    if (booking.status === 'completed') {
      toast.error('Cannot cancel a completed booking')
      return
    }

    // Check cancellation time limit (e.g., 24 hours before booking)
    const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`)
    const now = new Date()
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60)

    if (hoursUntilBooking < 24) {
      toast.error('Bookings can only be cancelled at least 24 hours in advance')
      return
    }

    // Enhanced confirmation dialog
    const confirmMessage = `Are you sure you want to cancel this booking?\n\nVenue: ${booking.venue?.name}\nDate: ${booking.date}\nTime: ${booking.startTime}\n\nThis action cannot be undone.`
    
    if (window.confirm(confirmMessage)) {
      cancelBookingMutation.mutate(booking._id)
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    const timeDiff = bookingDate.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 3600)
    
    return booking.status === 'confirmed' && hoursDiff > 24
  }

  const clearFilters = () => {
    setStatusFilter('')
    setDateFilter('')
    setCurrentPage(1)
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600">View and manage your court bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {(statusFilter || dateFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
        )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
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
            <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Browse Venues
              </button>
            </div>
          ) : (
            <>
              {data?.bookings?.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col lg:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.venue?.name}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {booking.court?.name} - {booking.court?.sportType}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{booking.venue?.shortLocation}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-green-600 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">
                            ${booking.totalAmount}
                          </span>
                        </div>

                        <div className="flex space-x-3">
                          {booking.status === 'completed' && (
                            <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700">
                              <Star className="w-4 h-4" />
                              <span>Rate</span>
                            </button>
                          )}
                          
                          {canCancelBooking(booking) && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={cancelBookingMutation.isLoading}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Cancel Booking
                            </button>
                          )}
                          
                          <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700">
                            <MessageSquare className="w-4 h-4" />
                            <span>Contact</span>
                          </button>
                        </div>
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
  )
}

export default MyBookingsPage
