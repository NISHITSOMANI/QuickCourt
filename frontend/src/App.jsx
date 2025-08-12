import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import AppRoutes from './routes/AppRoutes';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import './styles/variables.css';

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </BookingProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
