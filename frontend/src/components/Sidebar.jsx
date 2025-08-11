import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  MapPin,
  Clock,
  TrendingUp,
  UserCheck,
  Shield,
  Home,
  LogOut
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const getMenuItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: `/dashboard/${user?.role}`,
        icon: LayoutDashboard,
        roles: ['admin', 'owner', 'user']
      }
    ]

    const roleSpecificItems = {
      admin: [
        {
          name: 'User Management',
          href: '/admin/users',
          icon: Users,
          roles: ['admin']
        },
        {
          name: 'Venue Management',
          href: '/admin/facilities',
          icon: Building2,
          roles: ['admin']
        },
        {
          name: 'System Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          roles: ['admin']
        },
        {
          name: 'Approvals',
          href: '/admin/approvals',
          icon: UserCheck,
          roles: ['admin']
        },
        {
          name: 'System Settings',
          href: '/admin/settings',
          icon: Shield,
          roles: ['admin']
        }
      ],
      owner: [
        {
          name: 'My Venues',
          href: '/owner/courts',
          icon: Building2,
          roles: ['owner']
        },
        {
          name: 'Bookings',
          href: '/owner/bookings',
          icon: Calendar,
          roles: ['owner']
        },
        {
          name: 'Analytics',
          href: '/owner/analytics',
          icon: TrendingUp,
          roles: ['owner']
        },
        {
          name: 'Revenue',
          href: '/owner/revenue',
          icon: CreditCard,
          roles: ['owner']
        }
      ],
      user: [
        {
          name: 'My Bookings',
          href: '/my-bookings',
          icon: Calendar,
          roles: ['user']
        },
        {
          name: 'Payment History',
          href: '/user/payments',
          icon: CreditCard,
          roles: ['user']
        },
        {
          name: 'Favorite Venues',
          href: '/user/favorites',
          icon: MapPin,
          roles: ['user']
        }
      ]
    }

    const commonItems = [
      {
        name: 'Browse Venues',
        href: '/venues',
        icon: Home,
        roles: ['admin', 'owner', 'user']
      },
      {
        name: 'Profile',
        href: '/profile',
        icon: Settings,
        roles: ['admin', 'owner', 'user']
      }
    ]

    return [
      ...baseItems,
      ...(roleSpecificItems[user?.role] || []),
      ...commonItems
    ]
  }

  const menuItems = getMenuItems()

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await logout()
    onClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">QC</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">QuickCourt</h2>
                <p className="text-xs text-gray-500 capitalize">{user?.role} Dashboard</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
