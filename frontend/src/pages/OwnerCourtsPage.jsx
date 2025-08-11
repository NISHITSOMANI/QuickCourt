import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus,
  Edit3,
  Trash2,
  MapPin,
  DollarSign,
  Users,
  Clock,
  MoreVertical,
  Building2
} from 'lucide-react'
import { venueApi } from '../api/venueApi'
import toast from 'react-hot-toast'

const OwnerCourtsPage = () => {
  const [selectedVenue, setSelectedVenue] = useState('')
  const [showAddCourt, setShowAddCourt] = useState(false)
  const queryClient = useQueryClient()

  // Fetch owner venues
  const { data: venues, isLoading: venuesLoading } = useQuery(
    'owner-venues',
    () => venueApi.getVenues({ owner: true }),
    {
      select: (response) => response.data.venues || [],
    }
  )

  // Fetch courts for selected venue
  const { data: courts, isLoading: courtsLoading } = useQuery(
    ['venue-courts', selectedVenue],
    () => venueApi.getVenueCourts(selectedVenue),
    {
      select: (response) => response.data.courts || [],
      enabled: !!selectedVenue,
    }
  )

  // Delete court mutation
  const deleteCourtMutation = useMutation(
    (courtId) => venueApi.deleteCourt(courtId),
    {
      onSuccess: () => {
        toast.success('Court deleted successfully')
        queryClient.invalidateQueries(['venue-courts', selectedVenue])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete court')
      }
    }
  )

  const handleDeleteCourt = (courtId) => {
    if (window.confirm('Are you sure you want to delete this court?')) {
      deleteCourtMutation.mutate(courtId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Courts</h1>
          <p className="text-gray-600 mt-2">Manage your venue courts and facilities</p>
        </div>

        {/* Venue Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Venue
              </label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a venue...</option>
                {venues?.map((venue) => (
                  <option key={venue._id} value={venue._id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedVenue && (
              <button
                onClick={() => setShowAddCourt(true)}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Court</span>
              </button>
            )}
          </div>
        </div>

        {/* Courts List */}
        {selectedVenue && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Courts for {venues?.find(v => v._id === selectedVenue)?.name}
              </h2>
            </div>

            {courtsLoading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : courts?.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courts found</h3>
                <p className="text-gray-500 mb-4">Add your first court to get started</p>
                <button
                  onClick={() => setShowAddCourt(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Add Court
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {courts?.map((court) => (
                  <div key={court._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {court.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourt(court._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{court.sportType}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>${court.pricePerHour}/hour</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>
                              {court.operatingHours?.open || '06:00'} - {court.operatingHours?.close || '22:00'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              court.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {court.status || 'Active'}
                            </span>
                          </div>
                        </div>

                        {court.description && (
                          <p className="mt-2 text-sm text-gray-600">{court.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Venue Selected */}
        {!selectedVenue && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a venue</h3>
            <p className="text-gray-500">Choose a venue from the dropdown above to view and manage its courts</p>
          </div>
        )}

        {/* Add Court Modal - Placeholder */}
        {showAddCourt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Court</h3>
              <p className="text-gray-600 mb-4">Court creation form would go here</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddCourt(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddCourt(false)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                >
                  Add Court
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerCourtsPage
