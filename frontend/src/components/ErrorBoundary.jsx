import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Here you could also log the error to an error reporting service
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props

      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We're sorry, but something unexpected happened. Please try again.
              </p>
            </div>

            {showDetails && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Dashboard-specific error fallback
export const DashboardErrorFallback = ({ error, retry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard Error
        </h1>
        <p className="text-gray-600">
          There was an error loading your dashboard. This might be due to a network issue or server problem.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={retry}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Dashboard
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </button>
      </div>
    </div>
  </div>
)

// Page-specific error fallback
export const PageErrorFallback = ({ error, retry }) => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <div className="mb-6">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Failed to Load Content
      </h2>
      <p className="text-gray-600">
        We couldn't load this page. Please check your connection and try again.
      </p>
    </div>

    <div className="flex justify-center space-x-3">
      <button
        onClick={retry}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
      
      <button
        onClick={() => window.history.back()}
        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Go Back
      </button>
    </div>
  </div>
)

// Component-specific error fallback
export const ComponentErrorFallback = ({ error, retry, componentName = 'Component' }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center mb-2">
      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
      <h3 className="text-sm font-semibold text-red-800">
        {componentName} Error
      </h3>
    </div>
    <p className="text-sm text-red-700 mb-3">
      This component failed to load properly.
    </p>
    <button
      onClick={retry}
      className="flex items-center text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Retry
    </button>
  </div>
)

export default ErrorBoundary
