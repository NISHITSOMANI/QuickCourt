import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Public Pages
import LandingPage from '../pages/LandingPage'
import HomePage from '../pages/HomePage'
import VenuesPage from '../pages/VenuesPage'
import VenueDetailsPage from '../pages/VenueDetailsPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import EmailVerificationPage from '../pages/EmailVerificationPage'

// User Pages
import BookingPage from '../pages/BookingPage'
import PaymentPage from '../pages/PaymentPage'
import MyBookingsPage from '../pages/MyBookingsPage'
import UserPaymentsPage from '../pages/UserPaymentsPage'
import UserFavoritesPage from '../pages/UserFavoritesPage'
import ProfilePage from '../pages/ProfilePage'

// Dashboard Pages
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import OwnerDashboard from '../pages/dashboard/OwnerDashboard'
import UserDashboard from '../pages/dashboard/UserDashboard'

// Owner Pages
import OwnerCourtsPage from '../pages/OwnerCourtsPage'
import OwnerBookingsPage from '../pages/OwnerBookingsPage'
import OwnerProfilePage from '../pages/OwnerProfilePage'

// Admin Pages
import AdminFacilitiesPage from '../pages/AdminFacilitiesPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage'
import AdminProfilePage from '../pages/AdminProfilePage'

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
<<<<<<< HEAD
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
=======
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
              isAuthenticated ? <Navigate to={getDashboardRedirect()} replace /> : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to={getDashboardRedirect()} replace /> : <RegisterPage />
            }
          />
          <Route
            path="/verify-email"
            element={<EmailVerificationPage />}
          />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/owner"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/user"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Generic dashboard redirect */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Navigate to={getDashboardRedirect()} replace /> : <Navigate to="/login" replace />
            }
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
            path="/user/payments"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/favorites"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserFavoritesPage />
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
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
>>>>>>> 397a81807a22b22dc64c0598b3a6f980afb2a220

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
