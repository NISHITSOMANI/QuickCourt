import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  Clock,
  LogOut,
  User,
  Star
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, href, isActive, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </Link>
);

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    {
      name: 'Dashboard',
      href: `/dashboard/${user?.role}`,
      icon: LayoutDashboard,
      roles: ['admin', 'owner', 'user']
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Venue Management',
      href: '/owner/venues',
      icon: Building2,
      roles: ['admin', 'owner']
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: Calendar,
      roles: ['admin', 'owner', 'user']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'owner']
    },
    {
      name: 'My Bookings',
      href: '/my-bookings',
      icon: Calendar,
      roles: ['user']
    },
    {
      name: 'Favorites',
      href: '/favorites',
      icon: Star,
      roles: ['user']
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCard,
      roles: ['user']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'owner', 'user']
    }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role?.toLowerCase())
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">QuickCourt</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.name}
              href={item.href}
              isActive={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;