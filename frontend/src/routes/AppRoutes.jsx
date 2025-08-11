import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

// Public Pages
import LandingPage from '../pages/LandingPage'
import HomePage from '../pages/HomePage'
import VenuesPage from '../pages/VenuesPage'
import VenueDetailsPage from '../pages/VenueDetailsPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import EmailVerificationPage from '../pages/EmailVerificationPage'

// User Pages
import BookingPage from '../pages/BookingPage'
import PaymentPage from '../pages/PaymentPage'
import MyBookingsPage from '../pages/user/MyBookingsPage'
import ProfilePage from '../pages/user/ProfilePage'

// Dashboard Pages
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import OwnerDashboard from '../pages/dashboard/OwnerDashboard'

// Owner Pages
import OwnerCourtsPage from '../pages/owner/OwnerCourtsPage'
import OwnerBookingsPage from '../pages/owner/OwnerBookingsPage'
import OwnerProfilePage from '../pages/owner/OwnerProfilePage'

// Admin Pages
import AdminFacilitiesPage from '../pages/admin/AdminFacilitiesPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage'
import AdminProfilePage from '../pages/admin/AdminProfilePage'

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Dashboard redirect logic
  const getDashboardRedirect = () => {
    if (!isAuthenticated || !user?.role) return '/'
    return `/dashboard/${user.role}`
  }

  return (
    <Routes>
      {/* Landing Page - No Navbar */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />
        }
      />

      {/* Auth Routes - No Navbar */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/verify-email"
        element={<EmailVerificationPage />}
      />

      {/* Main App Routes - With Navbar */}
      <Route path="/*" element={
        <>
          <Navbar />
          <main className="min-h-screen">
            <Routes>
              {/* Public Routes */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:id" element={<VenueDetailsPage />} />

              {/* User Protected Routes */}
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Owner Protected Routes */}
              <Route
                path="/owner"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/courts"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerCourtsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/bookings"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/profile"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/facilities"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminFacilitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
          <Footer />
        </>
      } />
    </Routes>
  )
}

export default AppRoutes
