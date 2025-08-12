import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Shield,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { RevenueChart, UserActivityChart, VenueDistributionChart } from '../../components/dashboard/AnalyticsChart';
import { SkeletonCard, SkeletonChart } from '../../components/ui/LoadingSpinner';
import ErrorBoundary, { ComponentErrorFallback } from '../../components/common/ErrorBoundary';
import { adminApi } from '../../api/dashboardApi';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState('30'); // days
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard stats
  const {
    data: stats = {},
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery('adminStats', async () => {
    const response = await adminApi.getAnalytics();
    return response.data;
  }, {
    onError: (error) => {
      toast.error('Failed to load dashboard stats');
      console.error('Error fetching stats:', error);
    }
  });

  // Fetch recent activities
  const {
    data: recentActivities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities
  } = useQuery('recentActivities', async () => {
    const response = await adminApi.getActivities();
    return response.data;
  }, {
    onError: (error) => {
      toast.error('Failed to load recent activities');
      console.error('Error fetching activities:', error);
    }
  });

  // Refresh all data
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        refetchStats(),
        refetchActivities()
      ]);
      toast.success('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use data from API or empty arrays if loading
  const revenueData = stats.revenueData || [];
  const userActivityData = stats.userActivity || [];
  const venueDistributionData = stats.venueDistribution || [];

  // Destructure stats with default values
  const {
    totalUsers = 0,
    totalVenues = 0,
    totalBookings = 0,
    totalRevenue = 0,
    pendingApprovals = 0,
    activeReports = 0,
    systemHealth = 'checking'
  } = stats;

  const statCards = [
    {
      title: 'Total Users',
      value: (stats.totalUsers || 0).toLocaleString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    {
      title: 'Total Venues',
      value: stats.totalVenues || 0,
      change: '+8.1%',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-green-500',
      href: '/admin/facilities'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals || 0,
      change: '-2.1%',
      changeType: 'negative',
      icon: Clock,
      color: 'bg-orange-500',
      href: '/admin/approvals'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings || 0,
      change: '+12.4%',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/admin/bookings'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue || 0}`,
      change: '+5.2%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/admin/analytics'
    }
  ]

  const quickActions = [
    {
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600'
    },
    {
      name: 'Venue Management',
      description: 'Approve, reject, and manage venues',
      icon: Building2,
      href: '/admin/facilities',
      color: 'text-green-600'
    },
    {
      name: 'System Analytics',
      description: 'View platform performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-purple-600'
    },
    {
      name: 'Pending Approvals',
      description: 'Review venue approval requests',
      icon: UserCheck,
      href: '/admin/approvals',
      color: 'text-orange-600'
    },
    {
      name: 'System Settings',
      description: 'Configure platform settings',
      icon: Shield,
      href: '/admin/settings',
      color: 'text-red-600'
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
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Monitor platform activity and manage system operations"
    >
      {/* Date Range Filter */}
      <div className="mb-6">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' :
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
          </Link>
        ))}
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.pendingApprovals || 0}
            </span>
          </div>
          <p className="text-gray-600 mb-4">Venues waiting for approval</p>
          <Link
            to="/admin/approvals"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors block text-center"
          >
            Review Approvals
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Reports</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.activeReports || 0}
            </span>
          </div>
          <p className="text-gray-600 mb-4">User reports requiring attention</p>
          <Link
            to="/admin/reports"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium transition-colors block text-center"
          >
            Handle Reports
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Healthy
            </span>
          </div>
          <p className="text-gray-600 mb-4">All systems operational</p>
          <Link
            to="/admin/system"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors block text-center"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <RevenueChart data={revenueData} title="Platform Revenue Trend" />
        </ErrorBoundary>

        <ErrorBoundary fallback={ComponentErrorFallback}>
          <VenueDistributionChart data={venueDistributionData} title="Venues by Sport" />
        </ErrorBoundary>
      </div>

      <div className="mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <UserActivityChart data={userActivityData} title="Weekly User Activity" />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link
              to="/admin/activity"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
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
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <action.icon className={`w-5 h-5 mr-3 ${action.color}`} />
                  <div>
                    <span className="text-gray-700 font-medium">{action.name}</span>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
