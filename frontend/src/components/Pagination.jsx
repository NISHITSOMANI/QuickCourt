import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = '',
  showInfo = true 
}) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showInfo && (
        <div className="text-sm text-gray-700">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
      )}

      <nav className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }
                `}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
            }
          `}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </nav>
    </div>
  )
}

export default Pagination
