import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  Users, 
  Building2, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState('30') // days

  // Mock data - replace with actual API calls
  const stats = {
    totalUsers: 1250,
    totalVenues: 85,
    totalBookings: 3420,
    totalRevenue: 125000,
    pendingApprovals: 12,
    activeReports: 5
  }

  const recentActivities = [
    { id: 1, type: 'venue_approval', message: 'New venue "Sports Complex ABC" pending approval', time: '2 hours ago' },
    { id: 2, type: 'user_report', message: 'User reported inappropriate behavior', time: '4 hours ago' },
    { id: 3, type: 'booking_issue', message: 'Booking cancellation dispute raised', time: '6 hours ago' },
    { id: 4, type: 'venue_approval', message: 'Venue "Tennis Club XYZ" approved', time: '1 day ago' },
    { id: 5, type: 'system', message: 'System maintenance completed', time: '2 days ago' }
  ]

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Venues',
      value: stats.totalVenues,
      change: '+8.1%',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-green-500'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      change: '+22.5%',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Platform Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: '+18.7%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-yellow-500'
    }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'venue_approval':
        return <Building2 className="w-4 h-4 text-blue-500" />
      case 'user_report':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'booking_issue':
        return <Calendar className="w-4 h-4 text-orange-500" />
      case 'system':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor platform activity and manage system operations</p>
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

        {/* Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {stats.pendingApprovals}
              </span>
            </div>
            <p className="text-gray-600 mb-4">Venues waiting for approval</p>
            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Review Approvals
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Reports</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {stats.activeReports}
              </span>
            </div>
            <p className="text-gray-600 mb-4">User reports requiring attention</p>
            <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Handle Reports
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Healthy
              </span>
            </div>
            <p className="text-gray-600 mb-4">All systems operational</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              View Details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">Manage Users</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">Manage Facilities</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">View Analytics</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">System Settings</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
