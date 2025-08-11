// Mock data for development when backend is not available

export const mockVenues = [
  {
    _id: '1',
    name: 'Sports Complex ABC',
    description: 'Modern sports facility with multiple courts',
    address: '123 Sports Street, City Center',
    shortLocation: 'City Center',
    images: ['/images/venue1.jpg'],
    sports: ['badminton', 'tennis', 'basketball'],
    rating: 4.5,
    reviewCount: 128,
    priceRange: '$20-50',
    amenities: ['Parking', 'Changing Rooms', 'Cafeteria'],
    operatingHours: {
      open: '06:00',
      close: '22:00'
    },
    courts: [
      {
        _id: 'c1',
        name: 'Court 1',
        sportType: 'badminton',
        pricePerHour: 25,
        status: 'active'
      },
      {
        _id: 'c2',
        name: 'Court 2',
        sportType: 'tennis',
        pricePerHour: 35,
        status: 'active'
      }
    ]
  },
  {
    _id: '2',
    name: 'Elite Tennis Club',
    description: 'Premium tennis facility with professional courts',
    address: '456 Tennis Avenue, Sports District',
    shortLocation: 'Sports District',
    images: ['/images/venue2.jpg'],
    sports: ['tennis'],
    rating: 4.8,
    reviewCount: 89,
    priceRange: '$40-80',
    amenities: ['Pro Shop', 'Coaching', 'Lounge'],
    operatingHours: {
      open: '07:00',
      close: '21:00'
    },
    courts: [
      {
        _id: 'c3',
        name: 'Center Court',
        sportType: 'tennis',
        pricePerHour: 60,
        status: 'active'
      }
    ]
  },
  {
    _id: '3',
    name: 'Community Sports Hub',
    description: 'Affordable community sports center',
    address: '789 Community Road, Suburb',
    shortLocation: 'Suburb',
    images: ['/images/venue3.jpg'],
    sports: ['basketball', 'badminton', 'football'],
    rating: 4.2,
    reviewCount: 156,
    priceRange: '$15-30',
    amenities: ['Free Parking', 'Equipment Rental'],
    operatingHours: {
      open: '06:00',
      close: '23:00'
    },
    courts: [
      {
        _id: 'c4',
        name: 'Basketball Court A',
        sportType: 'basketball',
        pricePerHour: 20,
        status: 'active'
      },
      {
        _id: 'c5',
        name: 'Badminton Court 1',
        sportType: 'badminton',
        pricePerHour: 18,
        status: 'active'
      }
    ]
  }
]

export const mockBookings = [
  {
    _id: 'b1',
    venue: mockVenues[0],
    court: mockVenues[0].courts[0],
    user: { _id: 'u1', name: 'John Player', email: 'player@test.com' },
    date: '2024-01-25',
    startTime: '10:00',
    endTime: '11:00',
    totalAmount: 25,
    status: 'confirmed',
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    _id: 'b2',
    venue: mockVenues[1],
    court: mockVenues[1].courts[0],
    user: { _id: 'u1', name: 'John Player', email: 'player@test.com' },
    date: '2024-01-26',
    startTime: '14:00',
    endTime: '15:00',
    totalAmount: 60,
    status: 'pending',
    createdAt: '2024-01-21T14:00:00Z'
  },
  {
    _id: 'b3',
    venue: mockVenues[2],
    court: mockVenues[2].courts[0],
    user: { _id: 'u2', name: 'Jane Smith', email: 'jane@test.com' },
    date: '2024-01-24',
    startTime: '18:00',
    endTime: '19:00',
    totalAmount: 20,
    status: 'completed',
    createdAt: '2024-01-19T18:00:00Z'
  }
]

export const mockUsers = [
  {
    _id: 'u1',
    name: 'John Player',
    email: 'player@test.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2024-01-20',
    bookingsCount: 15
  },
  {
    _id: 'u2',
    name: 'Jane Owner',
    email: 'owner@test.com',
    role: 'owner',
    status: 'active',
    joinDate: '2024-01-10',
    lastLogin: '2024-01-19',
    venuesCount: 3
  },
  {
    _id: 'u3',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin',
    status: 'active',
    joinDate: '2024-01-05',
    lastLogin: '2024-01-18',
    isAdmin: true
  }
]

// Mock API responses
export const createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK'
  })
}

export const createMockError = (message = 'Network Error', status = 500) => {
  const error = new Error(message)
  error.response = {
    data: { message },
    status,
    statusText: 'Error'
  }
  return Promise.reject(error)
}
