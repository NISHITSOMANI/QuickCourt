import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import BaseLayout from '../layouts/BaseLayout';
import AdminLayout from '../layouts/AdminLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import UserLayout from '../layouts/UserLayout';

// Public Pages
import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import VenuesPage from '../pages/VenuesPage';
import VenueDetailsPage from '../pages/VenueDetailsPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// User Pages
import BookingPage from '../pages/BookingPage';
import PaymentPage from '../pages/PaymentPage';
import MyBookingsPage from '../pages/user/MyBookingsPage';
import UserProfilePage from '../pages/user/ProfilePage';

// Admin Pages
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminFacilitiesPage from '../pages/admin/AdminFacilitiesPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// Owner Pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import OwnerCourtsPage from '../pages/owner/OwnerCourtsPage';
import OwnerBookingsPage from '../pages/owner/OwnerBookingsPage';
import OwnerEarningsPage from '../pages/owner/OwnerEarningsPage';
import OwnerSettingsPage from '../pages/owner/OwnerSettingsPage';

// Public route wrapper to handle authentication state
const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, loading, getDashboardRoute } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = useState(false);
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    // Skip if still loading
    if (loading) return;

    // If this is a restricted route and user is authenticated, redirect to dashboard
    if (restricted && isAuthenticated) {
      // Prevent multiple redirects
      if (initialCheck) return;
      
      setInitialCheck(true);
      const from = location.state?.from || getDashboardRoute();
      
      // Only redirect if not already on the target route to prevent infinite loops
      if (location.pathname !== from) {
        navigate(from, { 
          replace: true,
          state: { preventAutoRedirect: true }
        });
      }
      return;
    }

    // If we get here, it's either a public route or user is not authenticated
    // Set a small timeout to ensure the component has time to mount
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated, 
    loading, 
    restricted, 
    location, 
    navigate, 
    getDashboardRoute, 
    initialCheck
  ]);

  // For non-restricted routes, always show children after initial check
  // For restricted routes, only show if we're sure we shouldn't redirect
  if ((!restricted && !loading) || (restricted && !isAuthenticated && !loading)) {
    return children;
  }

  // Show nothing while checking auth state
  return null;
};

// Role-based route wrapper
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Allow access if user has any of the allowed roles
  const hasAccess = allowedRoles.some(role => user?.role === role);
  
  if (!hasAccess) {
    console.warn(`Access denied. User role: ${user?.role}, Required roles:`, allowedRoles);
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root route - redirects based on auth status */}
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to={
            user?.role === 'admin' ? '/admin' : 
            user?.role === 'owner' ? '/owner' : 
            user?.role === 'user' ? '/user/my-bookings' : 
            '/login' 
          } replace />
        ) : (
          <LandingPage />
        )
      } />
      
      {/* Auth Routes */}
      <Route element={
        <PublicRoute restricted={true}>
          <LoginPage />
        </PublicRoute>
      } path="/login" />
      
      <Route element={
        <PublicRoute restricted={false}>
          <ForgotPasswordPage />
        </PublicRoute>
      } path="/forgot-password" />
      
      <Route element={
        <PublicRoute restricted={true}>
          <RegisterPage />
        </PublicRoute>
      } path="/register" />
      
      <Route element={
        <PublicRoute>
          <EmailVerificationPage />
        </PublicRoute>
      } path="/verify-email" />
      
      {/* Public Content Routes */}
      <Route element={
        <PublicRoute>
          <BaseLayout>
            <Outlet />
          </BaseLayout>
        </PublicRoute>
      }>
        <Route path="/home" element={<HomePage />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/venues/:id" element={<VenueDetailsPage />} />
      </Route>

      {/* User Routes */}
      <Route element={
        <RoleBasedRoute allowedRoles={['user']}>
          <UserLayout>
            <Outlet />
          </UserLayout>
        </RoleBasedRoute>
      }>
        <Route index element={<Navigate to="/user/my-bookings" replace />} />
        <Route path="/user/booking" element={<BookingPage />} />
        <Route path="/user/payment" element={<PaymentPage />} />
        <Route path="/user/my-bookings" element={<MyBookingsPage />} />
        <Route path="/user/profile" element={<UserProfilePage />} />
      </Route>

      {/* Owner Routes */}
      <Route element={
        <RoleBasedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <Outlet />
          </OwnerLayout>
        </RoleBasedRoute>
      }>
        <Route index element={<Navigate to="/owner" replace />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/owner/courts" element={<OwnerCourtsPage />} />
        <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
        <Route path="/owner/earnings" element={<OwnerEarningsPage />} />
        <Route path="/owner/settings" element={<OwnerSettingsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route element={
        <RoleBasedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </RoleBasedRoute>
      }>
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/facilities" element={<AdminFacilitiesPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Error Pages */}
      <Route path="/unauthorized" element={
        <BaseLayout>
          <UnauthorizedPage />
        </BaseLayout>
      } />
      
      <Route path="*" element={
        <BaseLayout>
          <NotFoundPage />
        </BaseLayout>
      } />
    </Routes>
  );
};

export default AppRoutes
