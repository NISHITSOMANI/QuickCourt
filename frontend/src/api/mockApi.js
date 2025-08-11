import { 
  mockVenues, 
  mockBookings, 
  mockUsers, 
  createMockResponse, 
  createMockError 
} from '../utils/mockData'

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock Venue API
export const mockVenueApi = {
  getVenues: async (params = {}) => {
    await delay()
    const { page = 1, limit = 10, search = '', sport = '' } = params
    
    let filteredVenues = mockVenues
    
    if (search) {
      filteredVenues = filteredVenues.filter(venue => 
        venue.name.toLowerCase().includes(search.toLowerCase()) ||
        venue.shortLocation.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (sport) {
      filteredVenues = filteredVenues.filter(venue => 
        venue.sports.includes(sport)
      )
    }
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedVenues = filteredVenues.slice(startIndex, endIndex)
    
    return createMockResponse({
      venues: paginatedVenues,
      total: filteredVenues.length,
      totalPages: Math.ceil(filteredVenues.length / limit),
      currentPage: page
    })
  },

  getVenueById: async (id) => {
    await delay()
    const venue = mockVenues.find(v => v._id === id)
    if (!venue) {
      return createMockError('Venue not found', 404)
    }
    return createMockResponse({ venue })
  },

  getVenueCourts: async (venueId) => {
    await delay()
    const venue = mockVenues.find(v => v._id === venueId)
    if (!venue) {
      return createMockError('Venue not found', 404)
    }
    return createMockResponse({ courts: venue.courts })
  }
}

// Mock Booking API
export const mockBookingApi = {
  getMyBookings: async (params = {}) => {
    await delay()
    const { page = 1, limit = 10, status = '' } = params
    
    let filteredBookings = mockBookings
    
    if (status) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.status === status
      )
    }
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex)
    
    return createMockResponse({
      bookings: paginatedBookings,
      total: filteredBookings.length,
      totalPages: Math.ceil(filteredBookings.length / limit),
      currentPage: page
    })
  },

  createBooking: async (bookingData) => {
    await delay()
    const newBooking = {
      _id: `b${Date.now()}`,
      ...bookingData,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    mockBookings.push(newBooking)
    return createMockResponse({ booking: newBooking })
  },

  cancelBooking: async (bookingId) => {
    await delay()
    const booking = mockBookings.find(b => b._id === bookingId)
    if (!booking) {
      return createMockError('Booking not found', 404)
    }
    booking.status = 'cancelled'
    return createMockResponse({ booking })
  }
}

// Mock Auth API
export const mockAuthApi = {
  login: async (credentials) => {
    await delay()
    const { email, password } = credentials
    
    // Simple mock authentication
    const user = mockUsers.find(u => u.email === email)
    if (!user || password !== 'password') {
      return createMockError('Invalid credentials', 401)
    }
    
    return createMockResponse({
      user,
      token: `mock-token-${user._id}`
    })
  },

  register: async (userData) => {
    await delay()
    const newUser = {
      _id: `u${Date.now()}`,
      ...userData,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    }
    mockUsers.push(newUser)
    return createMockResponse({
      user: newUser,
      token: `mock-token-${newUser._id}`
    })
  },

  getMe: async () => {
    await delay()
    // Return the first user as default
    return createMockResponse({ user: mockUsers[0] })
  },

  logout: async () => {
    await delay()
    return createMockResponse({ message: 'Logged out successfully' })
  }
}

// Mock Profile API
export const mockProfileApi = {
  updateProfile: async (userData) => {
    await delay()
    // Find and update user
    const userIndex = mockUsers.findIndex(u => u._id === userData._id)
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData }
      return createMockResponse({ user: mockUsers[userIndex] })
    }
    return createMockError('User not found', 404)
  },

  getOwnerStats: async (params) => {
    await delay()
    return createMockResponse({
      stats: {
        totalBookings: 45,
        activeVenues: 3,
        monthlyRevenue: 2500,
        averageRating: 4.5,
        recentBookings: mockBookings.slice(0, 5)
      }
    })
  }
}

// Check if we should use mock API (when backend is not available)
export const shouldUseMockApi = () => {
  return import.meta.env.VITE_USE_MOCK_API === 'true' || 
         import.meta.env.DEV // Use mock in development by default
}
