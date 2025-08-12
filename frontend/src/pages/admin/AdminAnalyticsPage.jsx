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
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { 
  RevenueChart, 
  UserActivityChart, 
  VenueDistributionChart, 
  BookingsChart,
  PerformanceChart 
} from '../../components/dashboard/AnalyticsChart'
import { SkeletonChart } from '../../components/ui/LoadingSpinner'
import ErrorBoundary, { ComponentErrorFallback } from '../../components/common/ErrorBoundary'
import { adminApi } from '../../api/dashboardApi'

const AdminAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('30')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch analytics data from backend
  const { data: analyticsData, isLoading, error, refetch } = useQuery(
    ['admin-analytics', dateRange],
    async () => {
      try {
        const response = await adminApi.getAnalytics({
          dateRange: parseInt(dateRange),
          includeCharts: true
        })
        return response.data
      } catch (error) {
        console.error('Error fetching analytics:', error)
        throw error
      }
    },
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${(analyticsData?.overview?.totalRevenue || 0).toLocaleString()}`,
      change: `+${analyticsData?.overview?.revenueGrowth || 0}%`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Users',
      value: (analyticsData?.overview?.totalUsers || 0).toLocaleString(),
      change: `+${analyticsData?.overview?.userGrowth || 0}%`,
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Venues',
      value: analyticsData?.overview?.totalVenues || 0,
      change: `+${analyticsData?.overview?.venueGrowth || 0}%`,
      changeType: 'positive',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Bookings',
      value: (analyticsData?.overview?.totalBookings || 0).toLocaleString(),
      change: `+${analyticsData?.overview?.bookingGrowth || 0}%`,
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
            data={analyticsData?.charts?.revenue || []} 
            title="Revenue vs Target" 
          />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <PerformanceChart 
            data={analyticsData?.charts?.performance || []} 
            title="Key Performance Metrics" 
          />
        </ErrorBoundary>
      </div>

      {/* User Activity and Venue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <UserActivityChart 
            data={analyticsData?.charts?.userActivity || []} 
            title="Weekly User Activity Trends" 
          />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <VenueDistributionChart 
            data={analyticsData?.charts?.venueDistribution || []} 
            title="Venue Distribution by Sport" 
          />
        </ErrorBoundary>
      </div>

      {/* Booking Trends */}
      <div className="mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <BookingsChart 
            data={analyticsData?.charts?.bookingTrends || []} 
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
