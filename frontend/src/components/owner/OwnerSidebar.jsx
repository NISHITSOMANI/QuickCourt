import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const OwnerSidebar = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/owner', icon: HomeIcon, current: location.pathname === '/owner' },
    { name: 'My Courts', href: '/owner/courts', icon: BuildingStorefrontIcon, current: location.pathname.startsWith('/owner/courts') },
    { name: 'Bookings', href: '/owner/bookings', icon: CalendarIcon, current: location.pathname.startsWith('/owner/bookings') },
    { name: 'Earnings', href: '/owner/earnings', icon: CurrencyDollarIcon, current: location.pathname.startsWith('/owner/earnings') },
    { name: 'Customers', href: '/owner/customers', icon: UserGroupIcon, current: location.pathname.startsWith('/owner/customers') },
    { name: 'Settings', href: '/owner/settings', icon: CogIcon, current: location.pathname.startsWith('/owner/settings') },
  ];

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
        <NavLink
          to="/logout"
          className="group flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-600 group-hover:bg-emerald-500">
              <ArrowLeftOnRectangleIcon className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Logout</p>
            </div>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default OwnerSidebar;
