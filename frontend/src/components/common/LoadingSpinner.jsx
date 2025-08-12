import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    white: 'text-white',
    gray: 'text-gray-500',
    red: 'text-red-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Loader2 
        className={`animate-spin ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary}`} 
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
    <LoadingSpinner size="lg" className="mb-4" />
    {message && <p className="text-gray-600 text-sm mt-2">{message}</p>}
  </div>
);

export const ButtonLoader = () => (
  <div className="flex items-center justify-center">
    <LoadingSpinner size="sm" color="white" className="mr-2" />
    Processing...
  </div>
);

export default LoadingSpinner;
