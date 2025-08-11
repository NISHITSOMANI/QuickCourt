import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DashboardLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = null
}) => {
  const {
    isAuthenticated,
    user,
    loading,
    hasAnyRole,
    hasPermission,
    getDashboardRoute
  } = useAuth()
  const location = useLocation()

  if (loading) {
    return <DashboardLoader />
  }

  if (!isAuthenticated) {
    toast.error('Please login to access this page')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role permissions
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    toast.error('You do not have permission to access this page')
    const fallbackRoute = redirectTo || getDashboardRoute()
    return <Navigate to={fallbackRoute} replace />
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    )

    if (!hasAllPermissions) {
      toast.error('Insufficient permissions to access this resource')
      const fallbackRoute = redirectTo || getDashboardRoute()
      return <Navigate to={fallbackRoute} replace />
    }
  }

  return children
}

export default ProtectedRoute
