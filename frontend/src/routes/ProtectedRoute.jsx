import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    toast.error('Please login to access this page')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    toast.error('You do not have permission to access this page')
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
