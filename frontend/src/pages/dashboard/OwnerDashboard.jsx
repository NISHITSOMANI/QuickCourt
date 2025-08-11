import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Star,
  Plus,
  Eye
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import { RevenueChart, BookingsChart } from '../../components/AnalyticsChart'
import ErrorBoundary, { ComponentErrorFallback } from '../../components/ErrorBoundary'
import { ownerApi } from '../../api/dashboardApi'

const OwnerDashboard = () => {
  const [dateRange, setDateRange] = useState('30') // days

  // Mock data - replace with actual API calls when backend is ready
  const stats = {
    totalVenues: 3,
    totalBookings: 156,
    totalRevenue: 12500,
    averageRating: 4.6,
    occupancyRate: 78,
    pendingBookings: 8
  }

  const recentBookings = [
    { id: 1, venue: 'Sports Complex A', court: 'Court 1', date: '2024-01-15', time: '10:00 AM', customer: 'John Doe', status: 'confirmed' },
    { id: 2, venue: 'Tennis Club B', court: 'Court 2', date: '2024-01-15', time: '2:00 PM', customer: 'Jane Smith', status: 'pending' },
    { id: 3, venue: 'Sports Complex A', court: 'Court 3', date: '2024-01-16', time: '6:00 PM', customer: 'Mike Johnson', status: 'confirmed' },
    { id: 4, venue: 'Badminton Center', court: 'Court 1', date: '2024-01-16', time: '8:00 AM', customer: 'Sarah Wilson', status: 'completed' }
  ]

  const venues = [
    { id: 1, name: 'Sports Complex A', courts: 5, bookings: 89, revenue: 7500, rating: 4.8, status: 'active' },
    { id: 2, name: 'Tennis Club B', courts: 3, bookings: 45, revenue: 3200, rating: 4.5, status: 'active' },
    { id: 3, name: 'Badminton Center', courts: 4, bookings: 22, revenue: 1800, rating: 4.4, status: 'pending' }
  ]

  // Analytics data
  const revenueData = [
    { month: 'Jan', revenue: 8500 },
    { month: 'Feb', revenue: 9200 },
    { month: 'Mar', revenue: 8800 },
    { month: 'Apr', revenue: 11200 },
    { month: 'May', revenue: 10500 },
    { month: 'Jun', revenue: 12500 }
  ]

  const bookingsData = [
    { date: 'Mon', bookings: 12 },
    { date: 'Tue', bookings: 8 },
    { date: 'Wed', bookings: 15 },
    { date: 'Thu', bookings: 11 },
    { date: 'Fri', bookings: 18 },
    { date: 'Sat', bookings: 22 },
    { date: 'Sun', bookings: 16 }
  ]

  const statCards = [
    {
      title: 'Total Venues',
      value: stats.totalVenues,
      change: '+1 this month',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-blue-500',
      href: '/owner/courts'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      change: '+23% vs last month',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/owner/bookings'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: '+18% vs last month',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-purple-500',
      href: '/owner/revenue'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      change: '+0.2 vs last month',
      changeType: 'positive',
      icon: Star,
      color: 'bg-yellow-500',
      href: '/owner/reviews'
    }
  ]

  const quickActions = [
    {
      name: 'Add New Venue',
      description: 'Register a new sports venue',
      icon: Plus,
      href: '/owner/venues/new',
      color: 'text-blue-600'
    },
    {
      name: 'Manage Venues',
      description: 'Edit existing venues and courts',
      icon: Building2,
      href: '/owner/courts',
      color: 'text-green-600'
    },
    {
      name: 'View Bookings',
      description: 'Manage all venue bookings',
      icon: Calendar,
      href: '/owner/bookings',
      color: 'text-purple-600'
    },
    {
      name: 'Analytics',
      description: 'View detailed performance metrics',
      icon: TrendingUp,
      href: '/owner/analytics',
      color: 'text-orange-600'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getVenueStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout 
      title="Owner Dashboard" 
      subtitle="Manage your venues and track performance"
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
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Occupancy Rate</h3>
            <span className="text-2xl font-bold text-blue-600">{stats.occupancyRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${stats.occupancyRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Average across all venues</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Bookings</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.pendingBookings}
            </span>
          </div>
          <p className="text-gray-600 mb-4">Bookings requiring confirmation</p>
          <Link
            to="/owner/bookings?status=pending"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium transition-colors block text-center"
          >
            Review Bookings
          </Link>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <RevenueChart data={revenueData} title="Monthly Revenue" />
        </ErrorBoundary>

        <ErrorBoundary fallback={ComponentErrorFallback}>
          <BookingsChart data={bookingsData} title="Weekly Bookings" />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <Link
              to="/owner/bookings"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{booking.venue}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{booking.court} • {booking.date} • {booking.time}</p>
                  <p className="text-xs text-gray-500">Customer: {booking.customer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Venue Performance</h3>
            <Link
              to="/owner/courts"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage All
            </Link>
          </div>

          <div className="space-y-4">
            {venues.map((venue) => (
              <div key={venue.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{venue.name}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getVenueStatusColor(venue.status)}`}>
                    {venue.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{venue.courts}</span> courts
                  </div>
                  <div>
                    <span className="font-medium">{venue.bookings}</span> bookings
                  </div>
                  <div>
                    <span className="font-medium">${venue.revenue}</span> revenue
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="font-medium">{venue.rating}</span>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Link
                    to={`/owner/venues/${venue.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors text-center"
                  >
                    Manage
                  </Link>
                  <Link
                    to={`/owner/venues/${venue.id}/analytics`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors text-center"
                  >
                    Analytics
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <action.icon className={`w-8 h-8 mb-2 ${action.color}`} />
                <span className="text-gray-700 font-medium text-sm">{action.name}</span>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OwnerDashboard
