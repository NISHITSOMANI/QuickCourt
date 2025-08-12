import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

const OwnerSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navigation = [
    { name: 'Dashboard', href: '/owner', icon: Home, current: location.pathname === '/owner' },
    { name: 'My Courts', href: '/owner/courts', icon: Building2, current: location.pathname.startsWith('/owner/courts') },
    { name: 'Bookings', href: '/owner/bookings', icon: Calendar, current: location.pathname.startsWith('/owner/bookings') },
    { name: 'Earnings', href: '/owner/earnings', icon: DollarSign, current: location.pathname.startsWith('/owner/earnings') },
    { name: 'Settings', href: '/owner/settings', icon: Settings, current: location.pathname.startsWith('/owner/settings') },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col w-64 h-full bg-emerald-700">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-xl font-bold">QuickCourt Owner</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                item.current
                  ? 'bg-emerald-800 text-white'
                  : 'text-emerald-100 hover:bg-emerald-600 hover:bg-opacity-75'
              }`}
            >
              <item.icon
                className={`mr-3 h-6 w-6 ${
                  item.current ? 'text-emerald-300' : 'text-emerald-200 group-hover:text-white'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-emerald-800 p-4">
        <button
          onClick={handleLogout}
          className="group flex-shrink-0 w-full group block hover:bg-emerald-600 rounded-md p-2 transition-colors"
        >
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-600 group-hover:bg-emerald-500">
              <LogOut className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Logout</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OwnerSidebar;
