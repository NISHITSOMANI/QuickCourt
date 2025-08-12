import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  Heart, 
  User, 
  LogOut,
  MapPin,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/user/dashboard',
      icon: Home,
      description: 'Overview and quick actions'
    },
    {
      name: 'Browse Venues',
      href: '/venues',
      icon: MapPin,
      description: 'Find and book courts'
    },
    {
      name: 'My Bookings',
      href: '/user/bookings',
      icon: Calendar,
      description: 'View and manage bookings'
    },
    {
      name: 'Payment History',
      href: '/user/payments',
      icon: CreditCard,
      description: 'Transaction history'
    },
    {
      name: 'Favorites',
      href: '/user/favorites',
      icon: Heart,
      description: 'Saved venues'
    },
    {
      name: 'Profile',
      href: '/user/profile',
      icon: User,
      description: 'Account settings'
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="text-xl font-bold text-gray-900">QuickCourt</span>
        </div>
      </div>

      {/* User Info Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-200 group"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Stats Section */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Active Bookings</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;
