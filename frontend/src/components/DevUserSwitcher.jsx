import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Shield, Building2 } from 'lucide-react'

const DevUserSwitcher = () => {
  const { user, updateUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Only show in development
  if (import.meta.env.PROD) return null

  const mockUsers = [
    {
      _id: '1',
      name: 'John Player',
      email: 'player@test.com',
      role: 'user',
      avatar: null
    },
    {
      _id: '2',
      name: 'Jane Owner',
      email: 'owner@test.com',
      role: 'owner',
      avatar: null
    },
    {
      _id: '3',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
      avatar: null
    }
  ]

  const handleUserSwitch = (mockUser) => {
    updateUser(mockUser)
    setIsOpen(false)
    // Force a page refresh to ensure all components update
    window.location.reload()
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />
      case 'owner':
        return <Building2 className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-green-600" />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'owner':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          DEV: Switch User
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-64">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Development User Switcher</h3>
              <p className="text-xs text-gray-600">Switch between user roles for testing</p>
            </div>
            
            <div className="p-2">
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500 mb-1">Current User:</div>
                {user ? (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    {getRoleIcon(user.role)}
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Not logged in</div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="text-xs font-medium text-gray-500 mb-2">Switch to:</div>
                <div className="space-y-1">
                  {mockUsers.map((mockUser) => (
                    <button
                      key={mockUser._id}
                      onClick={() => handleUserSwitch(mockUser)}
                      className={`w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors ${
                        user?.role === mockUser.role ? 'bg-gray-100' : ''
                      }`}
                    >
                      {getRoleIcon(mockUser.role)}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{mockUser.name}</div>
                        <div className="text-xs text-gray-600">{mockUser.email}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(mockUser.role)}`}>
                        {mockUser.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevUserSwitcher
