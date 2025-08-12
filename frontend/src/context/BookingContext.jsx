import React, { createContext, useContext, useReducer } from 'react'
import toast from 'react-hot-toast'

const BookingContext = createContext()

const initialState = {
  currentBooking: null,
  selectedVenue: null,
  selectedCourt: null,
  selectedDate: null,
  selectedTimeSlot: null,
  bookingStep: 1, // 1: venue, 2: court, 3: time, 4: payment
  loading: false,
  error: null,
}

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'SET_VENUE':
      return {
        ...state,
        selectedVenue: action.payload,
        selectedCourt: null,
        selectedDate: null,
        selectedTimeSlot: null,
        bookingStep: 2,
      }
    case 'SET_COURT':
      return {
        ...state,
        selectedCourt: action.payload,
        selectedDate: null,
        selectedTimeSlot: null,
        bookingStep: 3,
      }
    case 'SET_DATE':
      return {
        ...state,
        selectedDate: action.payload,
        selectedTimeSlot: null,
      }
    case 'SET_TIME_SLOT':
      return {
        ...state,
        selectedTimeSlot: action.payload,
        bookingStep: 4,
      }
    case 'SET_BOOKING_STEP':
      return {
        ...state,
        bookingStep: action.payload,
      }
    case 'SET_CURRENT_BOOKING':
      return {
        ...state,
        currentBooking: action.payload,
      }
    case 'RESET_BOOKING':
      return {
        ...initialState,
      }
    case 'COMPLETE_BOOKING':
      return {
        ...state,
        currentBooking: action.payload,
        bookingStep: 5, // completion step
      }
    default:
      return state
  }
}

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  const setVenue = (venue) => {
    // Critical venue validation
    if (!venue || !venue._id) {
      console.error('Invalid venue data provided to setVenue:', venue);
      return;
    }
    dispatch({ type: 'SET_VENUE', payload: venue })
  }

  const setCourt = (court) => {
    // Critical court validation
    if (!court || !court._id) {
      console.error('Invalid court data provided to setCourt:', court);
      return;
    }
    dispatch({ type: 'SET_COURT', payload: court })
  }

  const setDate = (date) => {
    // Critical date validation
    if (!date) {
      console.error('Invalid date provided to setDate:', date);
      return;
    }
    
    // Prevent past date bookings
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      console.error('Cannot set past date for booking:', date);
      return;
    }
    
    dispatch({ type: 'SET_DATE', payload: date })
  }

  const setTimeSlot = (timeSlot) => {
    // Critical time slot validation
    if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
      console.error('Invalid time slot provided to setTimeSlot:', timeSlot);
      return;
    }
    dispatch({ type: 'SET_TIME_SLOT', payload: timeSlot })
  }

  const setBookingStep = (step) => {
    dispatch({ type: 'SET_BOOKING_STEP', payload: step })
  }

  const setCurrentBooking = (booking) => {
    dispatch({ type: 'SET_CURRENT_BOOKING', payload: booking })
  }

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' })
  }

  const completeBooking = (booking) => {
    dispatch({ type: 'COMPLETE_BOOKING', payload: booking })
    toast.success('Booking completed successfully!')
  }

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error })
    if (error) {
      toast.error(error)
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const canProceedToNextStep = () => {
    switch (state.bookingStep) {
      case 1:
        return !!state.selectedVenue
      case 2:
        return !!state.selectedCourt
      case 3:
        return !!state.selectedDate && !!state.selectedTimeSlot
      case 4:
        return true // Payment step
      default:
        return false
    }
  }

  const getBookingSummary = () => {
    if (!state.selectedVenue || !state.selectedCourt || !state.selectedTimeSlot) {
      return null
    }

    return {
      venue: state.selectedVenue,
      court: state.selectedCourt,
      date: state.selectedDate,
      timeSlot: state.selectedTimeSlot,
      totalAmount: state.selectedCourt.pricePerHour * (
        (new Date(`1970-01-01T${state.selectedTimeSlot.endTime}:00`) - 
         new Date(`1970-01-01T${state.selectedTimeSlot.startTime}:00`)) / (1000 * 60 * 60)
      ),
    }
  }

  const value = {
    ...state,
    setVenue,
    setCourt,
    setDate,
    setTimeSlot,
    setBookingStep,
    setCurrentBooking,
    resetBooking,
    completeBooking,
    setLoading,
    setError,
    clearError,
    canProceedToNextStep,
    getBookingSummary,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}
