import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SportsCategories = ({ className = '' }) => {
  const navigate = useNavigate()
  const [selectedSport, setSelectedSport] = useState(null)

  const sportsCategories = [
    {
      id: 'badminton',
      name: 'Badminton',
      image: '/images/sports/badminton.jpg',
      description: 'Indoor racquet sport',
      venues: 120
    },
    {
      id: 'football',
      name: 'Football',
      image: '/images/sports/football.jpg',
      description: 'Outdoor team sport',
      venues: 85
    },
    {
      id: 'tennis',
      name: 'Tennis',
      image: '/images/sports/tennis.jpg',
      description: 'Court racquet sport',
      venues: 95
    },
    {
      id: 'basketball',
      name: 'Basketball',
      image: '/images/sports/basketball.jpg',
      description: 'Indoor/outdoor court sport',
      venues: 75
    },
    {
      id: 'cricket',
      name: 'Cricket',
      image: '/images/sports/cricket.jpg',
      description: 'Outdoor field sport',
      venues: 45
    },
    {
      id: 'table-tennis',
      name: 'Table Tennis',
      image: '/images/sports/table-tennis.jpg',
      description: 'Indoor paddle sport',
      venues: 60
    }
  ]

  const handleSportClick = (sport) => {
    setSelectedSport(sport.id)
    navigate(`/venues?sport=${sport.id}`)
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Popular Sports</h3>
        <button
          onClick={() => navigate('/venues')}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sportsCategories.map((sport) => (
          <div
            key={sport.id}
            onClick={() => handleSportClick(sport)}
            className={`
              relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg
              ${selectedSport === sport.id ? 'ring-2 ring-primary-500' : ''}
            `}
          >
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex flex-col items-center justify-center p-4">
              {/* Placeholder for sport image */}
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">
                  {sport.name.charAt(0)}
                </span>
              </div>
              
              <h4 className="text-sm font-semibold text-gray-900 text-center mb-1">
                {sport.name}
              </h4>
              
              <p className="text-xs text-gray-600 text-center mb-2">
                {sport.description}
              </p>
              
              <span className="text-xs text-primary-600 font-medium">
                {sport.venues} venues
              </span>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-primary-600 bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-medium opacity-0 hover:opacity-100 transition-opacity duration-300">
                Explore
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">500+</div>
            <div className="text-sm text-gray-600">Total Venues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">15+</div>
            <div className="text-sm text-gray-600">Sports Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">24/7</div>
            <div className="text-sm text-gray-600">Booking Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SportsCategories
