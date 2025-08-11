import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Calendar,
  DollarSign,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { 
  RevenueChart, 
  UserActivityChart, 
  VenueDistributionChart, 
  BookingsChart,
  PerformanceChart 
} from '../components/AnalyticsChart'
import { SkeletonChart } from '../components/LoadingSpinner'
import ErrorBoundary, { ComponentErrorFallback } from '../components/ErrorBoundary'
import { adminApi } from '../api/dashboardApi'

const AdminAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('30')
  const [refreshing, setRefreshing] = useState(false)

  // Mock analytics data - replace with actual API calls
  const analyticsData = {
    overview: {
      totalRevenue: 125000,
      totalUsers: 1250,
      totalVenues: 85,
      totalBookings: 3420,
      revenueGrowth: 18.7,
      userGrowth: 15.3,
      venueGrowth: 8.1,
      bookingGrowth: 22.5
    },
    charts: {
      revenue: [
        { month: 'Jan', revenue: 45000, target: 40000 },
        { month: 'Feb', revenue: 52000, target: 45000 },
        { month: 'Mar', revenue: 48000, target: 50000 },
        { month: 'Apr', revenue: 61000, target: 55000 },
        { month: 'May', revenue: 55000, target: 60000 },
        { month: 'Jun', revenue: 67000, target: 65000 }
      ],
      userActivity: [
        { date: 'Week 1', newUsers: 45, activeUsers: 890, bookings: 234 },
        { date: 'Week 2', newUsers: 52, activeUsers: 945, bookings: 267 },
        { date: 'Week 3', newUsers: 38, activeUsers: 912, bookings: 245 },
        { date: 'Week 4', newUsers: 61, activeUsers: 1023, bookings: 289 }
      ],
      venueDistribution: [
        { name: 'Badminton', count: 35, percentage: 41.2 },
        { name: 'Tennis', count: 25, percentage: 29.4 },
        { name: 'Basketball', count: 15, percentage: 17.6 },
        { name: 'Football', count: 10, percentage: 11.8 }
      ],
      bookingTrends: [
        { date: 'Mon', bookings: 89, cancellations: 12 },
        { date: 'Tue', bookings: 76, cancellations: 8 },
        { date: 'Wed', bookings: 94, cancellations: 15 },
        { date: 'Thu', bookings: 87, cancellations: 11 },
        { date: 'Fri', bookings: 102, cancellations: 18 },
        { date: 'Sat', bookings: 125, cancellations: 22 },
        { date: 'Sun', bookings: 98, cancellations: 16 }
      ],
      performance: [
        { metric: 'Conversion Rate', current: 85, previous: 78 },
        { metric: 'User Retention', current: 92, previous: 89 },
        { metric: 'Avg Session', current: 76, previous: 72 },
        { metric: 'Satisfaction', current: 94, previous: 91 }
      ]
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${analyticsData.overview.totalRevenue.toLocaleString()}`,
      change: `+${analyticsData.overview.revenueGrowth}%`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Users',
      value: analyticsData.overview.totalUsers.toLocaleString(),
      change: `+${analyticsData.overview.userGrowth}%`,
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Venues',
      value: analyticsData.overview.totalVenues,
      change: `+${analyticsData.overview.venueGrowth}%`,
      changeType: 'positive',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Bookings',
      value: analyticsData.overview.totalBookings.toLocaleString(),
      change: `+${analyticsData.overview.bookingGrowth}%`,
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ]

  return (
    <DashboardLayout 
      title="Platform Analytics" 
      subtitle="Comprehensive insights into platform performance and user behavior"
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Overview Stats */}
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

      {/* Revenue and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <RevenueChart 
            data={analyticsData.charts.revenue} 
            title="Revenue vs Target" 
          />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <PerformanceChart 
            data={analyticsData.charts.performance} 
            title="Key Performance Metrics" 
          />
        </ErrorBoundary>
      </div>

      {/* User Activity and Venue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <UserActivityChart 
            data={analyticsData.charts.userActivity} 
            title="Weekly User Activity Trends" 
          />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <VenueDistributionChart 
            data={analyticsData.charts.venueDistribution} 
            title="Venue Distribution by Sport" 
          />
        </ErrorBoundary>
      </div>

      {/* Booking Trends */}
      <div className="mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <BookingsChart 
            data={analyticsData.charts.bookingTrends} 
            title="Daily Booking and Cancellation Trends" 
          />
        </ErrorBoundary>
      </div>

      {/* Insights Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Revenue Growth</h4>
            </div>
            <p className="text-sm text-green-700">
              Platform revenue increased by 18.7% compared to last period, exceeding targets.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">User Acquisition</h4>
            </div>
            <p className="text-sm text-blue-700">
              New user registrations are up 15.3% with strong retention rates.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Building2 className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-purple-800">Venue Expansion</h4>
            </div>
            <p className="text-sm text-purple-700">
              8.1% growth in venue partnerships, with badminton leading the category.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminAnalyticsPage
