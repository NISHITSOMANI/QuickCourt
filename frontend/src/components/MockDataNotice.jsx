import { useState } from 'react'
import { X, Database } from 'lucide-react'

const MockDataNotice = () => {
  const [isVisible, setIsVisible] = useState(true)

  // Only show in development when using mock API
  if (import.meta.env.PROD || import.meta.env.VITE_USE_MOCK_API !== 'true' || !isVisible) {
    return null
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-blue-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Development Mode - Using Mock Data
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Backend server not connected. All data is simulated for development purposes.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-400 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MockDataNotice
