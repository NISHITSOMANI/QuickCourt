import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'

// Custom hook for fetching data with loading and error states
export const useFetch = (queryKey, queryFn, options = {}) => {
  return useQuery(queryKey, queryFn, {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Custom hook for mutations with optimistic updates
export const useMutate = (mutationFn, options = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation(mutationFn, {
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries(queryKey)
        })
      }
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates if needed
      if (context?.previousData && options.rollbackQuery) {
        queryClient.setQueryData(options.rollbackQuery, context.previousData)
      }
      
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    ...options,
  })
}

// Custom hook for paginated data
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const goToPage = (newPage) => {
    setPage(newPage)
  }

  const nextPage = () => {
    setPage(prev => prev + 1)
  }

  const prevPage = () => {
    setPage(prev => Math.max(1, prev - 1))
  }

  const changeLimit = (newLimit) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  const reset = () => {
    setPage(initialPage)
    setLimit(initialLimit)
  }

  return {
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
  }
}

// Custom hook for debounced values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Custom hook for local storage
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}
