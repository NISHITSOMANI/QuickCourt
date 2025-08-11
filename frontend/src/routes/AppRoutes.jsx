import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Public Pages
import HomePage from '../pages/HomePage'
import VenuesPage from '../pages/VenuesPage'
import VenueDetailsPage from '../pages/VenueDetailsPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import EmailVerificationPage from '../pages/EmailVerificationPage'

// User Pages
import BookingPage from '../pages/BookingPage'
import MyBookingsPage from '../pages/MyBookingsPage'
import ProfilePage from '../pages/ProfilePage'

// Owner Pages
import OwnerDashboard from '../pages/OwnerDashboard'
import OwnerCourtsPage from '../pages/OwnerCourtsPage'
import OwnerBookingsPage from '../pages/OwnerBookingsPage'
import OwnerProfilePage from '../pages/OwnerProfilePage'

// Admin Pages
import AdminDashboard from '../pages/AdminDashboard'
import AdminFacilitiesPage from '../pages/AdminFacilitiesPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminProfilePage from '../pages/AdminProfilePage'

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />
          
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
            }
          />
          <Route
            path="/verify-email"
            element={<EmailVerificationPage />}
          />

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default AppRoutes
