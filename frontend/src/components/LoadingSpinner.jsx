import React from 'react'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = '', 
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  }

  const spinnerClass = `${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={spinnerClass}></div>
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
        {content}
      </div>
    )
  }

  return content
}

// Predefined loading components for common use cases
export const PageLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="lg" text={text} fullScreen />
)

export const CardLoader = ({ text = 'Loading...' }) => (
  <div className="bg-white rounded-lg shadow-md p-8">
    <LoadingSpinner size="md" text={text} />
  </div>
)

export const ButtonLoader = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} color="white" />
)

export const TableLoader = () => (
  <div className="bg-white rounded-lg shadow-md p-12">
    <LoadingSpinner size="lg" text="Loading data..." />
  </div>
)

export const DashboardLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" color="blue" />
      <p className="mt-4 text-lg text-gray-600 font-medium">Loading Dashboard...</p>
      <p className="mt-2 text-sm text-gray-500">Please wait while we prepare your data</p>
    </div>
  </div>
)

// Skeleton loaders for better perceived performance
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export const SkeletonChart = ({ height = 300 }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
    <div 
      className="bg-gray-200 rounded animate-pulse" 
      style={{ height: `${height}px` }}
    ></div>
  </div>
)

export default LoadingSpinner
