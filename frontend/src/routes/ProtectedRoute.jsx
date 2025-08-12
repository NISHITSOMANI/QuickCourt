import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = null
}) => {
  const {
    isAuthenticated,
    loading,
    hasAnyRole,
    hasPermission,
    getDashboardRoute
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [initialCheck, setInitialCheck] = useState(false);

  // Check authentication and authorization status
  useEffect(() => {
    // Skip if still loading
    if (loading) return;

    // If not authenticated, redirect to login immediately
    if (!isAuthenticated) {
      // Prevent any state updates after redirect is initiated
      if (initialCheck) return;
      
      setInitialCheck(true);
      toast.error('Please login to access this page');
      navigate('/login', { 
        state: { 
          from: location.pathname !== '/login' ? location.pathname : '/',
          preventAutoRedirect: true
        }, 
        replace: true 
      });
      return;
    }

    // If authenticated, check roles and permissions
    if (isAuthenticated) {
      // Check roles if specified
      if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
        toast.error('You do not have permission to access this page');
        const fallbackRoute = redirectTo || getDashboardRoute();
        navigate(fallbackRoute, { replace: true });
        return;
      }

      // Check specific permissions if specified
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          hasPermission(permission)
        );

        if (!hasAllPermissions) {
          toast.error('Insufficient permissions to access this resource');
          const fallbackRoute = redirectTo || getDashboardRoute();
          navigate(fallbackRoute, { replace: true });
          return;
        }
      }

      // If we get here, user is authorized
      setIsAuthorized(true);
    }
  }, [
    isAuthenticated, 
    loading, 
    location, 
    navigate, 
    allowedRoles, 
    requiredPermissions, 
    redirectTo, 
    hasAnyRole, 
    hasPermission, 
    getDashboardRoute,
    initialCheck
  ]);

  // Show nothing while checking auth or if not authorized
  if (loading || !initialCheck || !isAuthorized) {
    return null;
  }

  // Only render children if user is authenticated and authorized
  return children;

  return children
}

export default ProtectedRoute
