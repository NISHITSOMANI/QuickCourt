import { useState } from 'react'
import { Search, MapPin, Calendar, Clock } from 'lucide-react'

const SearchBar = ({ onSearch, className = '' }) => {
  const [searchData, setSearchData] = useState({
    location: '',
    sport: '',
    date: '',
    time: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchData)
  }

  const handleChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const sportOptions = [
    { value: '', label: 'All Sports' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'football', label: 'Football' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'squash', label: 'Squash' },
  ]

  const timeOptions = [
    { value: '', label: 'Any Time' },
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 10PM)' },
  ]

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Enter city or area"
                value={searchData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sport */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              value={searchData.sport}
              onChange={(e) => handleChange('sport', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sportOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={searchData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Time */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={searchData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Courts</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default SearchBar
