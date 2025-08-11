import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  Shield,
  ShieldOff,
  Eye,
  Mail,
  Calendar
} from 'lucide-react'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'

const AdminUsersPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  // Mock data - replace with actual API calls
  const mockUsers = {
    users: [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        joinDate: '2024-01-15',
        lastLogin: '2024-01-20',
        bookingsCount: 15
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'owner',
        status: 'active',
        joinDate: '2024-01-10',
        lastLogin: '2024-01-19',
        venuesCount: 3
      },
      {
        _id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'user',
        status: 'suspended',
        joinDate: '2024-01-05',
        lastLogin: '2024-01-18',
        bookingsCount: 8
      }
    ],
    totalPages: 1,
    total: 3
  }

  const data = mockUsers
  const isLoading = false
  const error = null

  // Update user status mutation (mock)
  const updateUserStatusMutation = useMutation(
    ({ userId, status }) => Promise.resolve({ userId, status }),
    {
      onSuccess: () => {
        toast.success('User status updated successfully')
        queryClient.invalidateQueries('admin-users')
      },
      onError: (error) => {
        toast.error('Failed to update user status')
      }
    }
  )

  const handleStatusUpdate = (userId, status) => {
    const action = status === 'active' ? 'activate' : 'suspend'
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      updateUserStatusMutation.mutate({ userId, status })
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100'
      case 'owner':
        return 'text-blue-600 bg-blue-100'
      case 'user':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'suspended':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const clearFilters = () => {
    setRoleFilter('')
    setStatusFilter('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage platform users and their permissions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="owner">Venue Owners</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex items-end">
              {(roleFilter || statusFilter || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded h-16 animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Error loading users. Please try again.</p>
            </div>
          ) : data?.users?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">No users match your current filters.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Join Date</div>
                  <div className="col-span-2">Activity</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {data?.users?.map((user) => (
                  <div key={user._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* User Info */}
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>

                      {/* Join Date */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900">{formatDate(user.joinDate)}</div>
                        <div className="text-sm text-gray-500">Last: {formatDate(user.lastLogin)}</div>
                      </div>

                      {/* Activity */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900">
                          {user.role === 'owner' 
                            ? `${user.venuesCount || 0} venues`
                            : `${user.bookingsCount || 0} bookings`
                          }
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleStatusUpdate(user._id, 'suspended')}
                              className="text-gray-400 hover:text-red-600"
                              title="Suspend user"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(user._id, 'active')}
                              className="text-gray-400 hover:text-green-600"
                              title="Activate user"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={data.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
