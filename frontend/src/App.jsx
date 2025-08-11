import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import AppRoutes from './routes/AppRoutes'
import DevUserSwitcher from './components/DevUserSwitcher'
import MockDataNotice from './components/MockDataNotice'
import './styles/variables.css'

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <div className="min-h-screen bg-gray-50">
          <MockDataNotice />
          <AppRoutes />
          <DevUserSwitcher />
        </div>
      </BookingProvider>
    </AuthProvider>
  )
}

export default App
