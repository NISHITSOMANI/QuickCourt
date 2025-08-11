import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users,
  TrendingUp,
  Building2,
  Clock,
  Star
} from 'lucide-react'
import { profileApi } from '../api/profileApi'
import { venueApi } from '../api/venueApi'

const OwnerDashboard = () => {
  const [dateRange, setDateRange] = useState('7') // days

  // Fetch owner stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['owner-stats', dateRange],
    () => profileApi.getOwnerStats({ period: dateRange }),
    {
      select: (response) => response.data.stats || {},
    }
  )

  // Fetch owner venues
  const { data: venues, isLoading: venuesLoading } = useQuery(
    'owner-venues',
    () => venueApi.getVenues({ owner: true, limit: 5 }),
    {
      select: (response) => response.data.venues || [],
    }
  )

  // Fetch earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery(
    ['owner-earnings', dateRange],
    () => profileApi.getOwnerEarnings({ 
      dateFrom: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    }),
    {
      select: (response) => response.data.earnings || {},
    }
  )

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${earnings?.total || 0}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      change: '+8.2%',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Venues',
      value: stats?.activeVenues || 0,
      change: '0%',
      changeType: 'neutral',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: 'Average Rating',
      value: stats?.averageRating?.toFixed(1) || '0.0',
      change: '+0.3',
      changeType: 'positive',
      icon: Star,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your venues and track performance</p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>

            {statsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded h-16 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentBookings?.slice(0, 5).map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.venueName}</p>
                      <p className="text-sm text-gray-600">{booking.courtName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${booking.amount}</p>
                      <p className="text-sm text-gray-600">{booking.date}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No recent bookings</p>
                )}
              </div>
            )}
          </div>

          {/* Venue Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Venue Performance</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Manage Venues
              </button>
            </div>

            {venuesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded h-20 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {venues?.map((venue) => (
                  <div key={venue._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{venue.name}</h4>
                        <p className="text-sm text-gray-600">{venue.shortLocation}</p>
                        <div className="flex items-center mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {venue.rating?.toFixed(1) || '0.0'} ({venue.reviewCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">This month</p>
                        <p className="font-semibold text-green-600">
                          ${venue.monthlyRevenue || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No venues found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Building2 className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Add New Venue</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Calendar className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Manage Bookings</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <BarChart3 className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboard
