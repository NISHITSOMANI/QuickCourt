import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  CreditCard,
  MapPin,
  Clock,
  Star,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Trophy,
  Heart
} from 'lucide-react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { userApi } from '../../../api/dashboardApi'

const UserDashboard = () => {
  const [dateRange, setDateRange] = useState('30') // days

  // Mock data - replace with actual API calls when backend is ready
  const stats = {
    totalBookings: 24,
    upcomingBookings: 3,
    totalSpent: 1250,
    favoriteVenues: 5,
    hoursPlayed: 48,
    preferredSport: 'Badminton'
  }

  const upcomingBookings = [
    { 
      id: 1, 
      venue: 'Sports Complex A', 
      court: 'Court 1', 
      sport: 'Badminton',
      date: '2024-01-15', 
      time: '10:00 AM - 11:00 AM', 
      amount: 50,
      status: 'confirmed' 
    },
    { 
      id: 2, 
      venue: 'Tennis Club B', 
      court: 'Court 2', 
      sport: 'Tennis',
      date: '2024-01-16', 
      time: '6:00 PM - 7:00 PM', 
      amount: 75,
      status: 'confirmed' 
    },
    { 
      id: 3, 
      venue: 'Fitness Center C', 
      court: 'Court 1', 
      sport: 'Squash',
      date: '2024-01-18', 
      time: '8:00 AM - 9:00 AM', 
      amount: 60,
      status: 'pending' 
    }
  ]

  const recentBookings = [
    { 
      id: 4, 
      venue: 'Sports Complex A', 
      court: 'Court 3', 
      sport: 'Badminton',
      date: '2024-01-10', 
      time: '2:00 PM - 3:00 PM', 
      amount: 50,
      status: 'completed' 
    },
    { 
      id: 5, 
      venue: 'Basketball Arena', 
      court: 'Court 1', 
      sport: 'Basketball',
      date: '2024-01-08', 
      time: '7:00 PM - 8:00 PM', 
      amount: 40,
      status: 'completed' 
    },
    { 
      id: 6, 
      venue: 'Tennis Club B', 
      court: 'Court 1', 
      sport: 'Tennis',
      date: '2024-01-05', 
      time: '5:00 PM - 6:00 PM', 
      amount: 75,
      status: 'completed' 
    }
  ]

  const favoriteVenues = [
    { id: 1, name: 'Sports Complex A', sport: 'Badminton', rating: 4.8, bookings: 8, lastVisit: '2024-01-10' },
    { id: 2, name: 'Tennis Club B', sport: 'Tennis', rating: 4.6, bookings: 5, lastVisit: '2024-01-08' },
    { id: 3, name: 'Fitness Center C', sport: 'Squash', rating: 4.7, bookings: 3, lastVisit: '2024-01-05' }
  ]

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      change: '+3 this month',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-blue-500',
      href: '/my-bookings'
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      change: 'Next 7 days',
      changeType: 'neutral',
      icon: Clock,
      color: 'bg-green-500',
      href: '/my-bookings?filter=upcoming'
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent}`,
      change: '+$150 this month',
      changeType: 'positive',
      icon: CreditCard,
      color: 'bg-purple-500',
      href: '/user/payments'
    },
    {
      title: 'Hours Played',
      value: stats.hoursPlayed,
      change: '+12 this month',
      changeType: 'positive',
      icon: Trophy,
      color: 'bg-yellow-500',
      href: '/user/stats'
    }
  ]

  const quickActions = [
    {
      name: 'Book a Court',
      description: 'Find and book your next game',
      icon: Plus,
      href: '/venues',
      color: 'text-blue-600'
    },
    {
      name: 'My Bookings',
      description: 'View and manage your bookings',
      icon: Calendar,
      href: '/my-bookings',
      color: 'text-green-600'
    },
    {
      name: 'Payment History',
      description: 'View your payment records',
      icon: CreditCard,
      href: '/user/payments',
      color: 'text-purple-600'
    },
    {
      name: 'Favorite Venues',
      description: 'Quick access to your favorites',
      icon: Heart,
      href: '/user/favorites',
      color: 'text-red-600'
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

  const getSportIcon = (sport) => {
    // You can add sport-specific icons here
    return <Trophy className="w-4 h-4" />
  }

  return (
    <DashboardLayout 
      title="My Dashboard" 
      subtitle="Track your bookings and sports activity"
    >
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

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Preferred Sport</h3>
            <div className="flex items-center text-blue-600">
              {getSportIcon(stats.preferredSport)}
              <span className="ml-2 font-medium">{stats.preferredSport}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">Based on your booking history</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Book</h3>
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm mb-4">Book your favorite venue again</p>
          <Link
            to="/venues?sport=badminton"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors block text-center"
          >
            Find {stats.preferredSport} Courts
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
            <Link
              to="/my-bookings?filter=upcoming"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{booking.venue}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      {getSportIcon(booking.sport)}
                      <span className="ml-2">{booking.sport} • {booking.court}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {booking.date} • {booking.time}
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      ${booking.amount}
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors text-center"
                    >
                      View Details
                    </Link>
                    {booking.status === 'confirmed' && (
                      <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming bookings</p>
              <Link
                to="/venues"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                Book a Court
              </Link>
            </div>
          )}
        </div>

        {/* Favorite Venues */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Favorite Venues</h3>
            <Link
              to="/user/favorites"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {favoriteVenues.map((venue) => (
              <div key={venue.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{venue.name}</h4>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{venue.rating}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    {getSportIcon(venue.sport)}
                    <span className="ml-2">{venue.sport}</span>
                  </div>
                  <div>
                    <span className="font-medium">{venue.bookings}</span> bookings
                  </div>
                  <div>
                    Last visit: {venue.lastVisit}
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/venues/${venue.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors block text-center"
                  >
                    Book Again
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

export default UserDashboard
