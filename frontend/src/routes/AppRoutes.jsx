import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import TermsOfServicePage from '../pages/legal/TermsOfServicePage';
import PrivacyPolicyPage from '../pages/legal/PrivacyPolicyPage';
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

  // SKIP loading check for landing page - allow immediate access
  const isLandingPage = window.location.pathname === '/';
  
  // Show loading spinner while checking auth (except for landing page)
  if (loading && !isLandingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If this is a restricted route (login/register) and user is authenticated, redirect to dashboard
  if (restricted && isAuthenticated) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  // Otherwise, show the children
  return children;
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

  console.log(' AppRoutes rendering - authenticated:', isAuthenticated, 'user:', user?.role);
  
  // NUCLEAR SOLUTION: Prevent any loading states or auth checks from blocking landing page
  const shouldShowLoadingSpinner = loading && window.location.pathname !== '/';
  
  return (
    <Routes>
      {/* Root route - Landing page accessible to EVERYONE - COMPLETELY ISOLATED FROM AUTH */}
      <Route path="/" element={
        <BaseLayout>
          <LandingPage />
        </BaseLayout>
      } />
      
      {/* Auth Routes */}
      <Route element={
        <PublicRoute restricted={true}>
          <LoginPage />
        </PublicRoute>
      } path="/login" />
      
      <Route element={
        <PublicRoute restricted={true}>
          <ForgotPasswordPage />
        </PublicRoute>
      } path="/forgot-password" />
      
      <Route element={
        <PublicRoute restricted={true}>
          <RegisterPage />
        </PublicRoute>
      } path="/register" />
      
      <Route element={
        <PublicRoute restricted={true}>
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
        <Route index element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/facilities" element={<AdminFacilitiesPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Legal Pages */}
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />

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
