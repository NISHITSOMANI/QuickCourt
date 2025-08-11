# QuickCourt Frontend

A modern React frontend for the QuickCourt sports venue booking platform built with Vite, React Query, and Tailwind CSS.

## Features

- **Modern React Architecture**: Built with React 18, hooks, and context API
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: React Query for server state, Context API for client state
- **Authentication**: JWT-based authentication with protected routes
- **Real-time Updates**: Optimistic updates and real-time data synchronization
- **Type Safety**: PropTypes validation and consistent API interfaces
- **Performance**: Code splitting, lazy loading, and optimized bundle size

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

## Project Structure

```
src/
├── api/                    # API layer
│   ├── config.js          # Axios configuration
│   ├── authApi.js         # Authentication endpoints
│   ├── venueApi.js        # Venue endpoints
│   ├── bookingApi.js      # Booking endpoints
│   └── profileApi.js      # Profile endpoints
├── components/            # Reusable components
│   ├── Navbar.jsx         # Navigation component
│   ├── Footer.jsx         # Footer component
│   ├── VenueCard.jsx      # Venue display card
│   ├── SearchBar.jsx      # Search functionality
│   ├── FilterPanel.jsx    # Filtering component
│   └── Pagination.jsx     # Pagination component
├── context/               # React contexts
│   ├── AuthContext.jsx    # Authentication state
│   └── BookingContext.jsx # Booking flow state
├── hooks/                 # Custom hooks
│   ├── useAuth.js         # Authentication hook
│   ├── useFetch.js        # Data fetching hooks
│   └── usePagination.js   # Pagination hook
├── pages/                 # Page components
│   ├── HomePage.jsx       # Landing page
│   ├── VenuesPage.jsx     # Venue listing
│   ├── LoginPage.jsx      # User login
│   ├── RegisterPage.jsx   # User registration
│   └── ...               # Other pages
├── routes/                # Routing configuration
│   ├── AppRoutes.jsx      # Main routing
│   └── ProtectedRoute.jsx # Route protection
├── styles/                # Global styles
│   ├── globals.css        # Global CSS
│   └── variables.css      # CSS variables
├── App.jsx               # Root component
└── main.jsx              # Entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running on http://localhost:5000

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment setup:**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## User Roles & Features

### Public Users
- Browse venues and view details
- Search and filter venues
- View venue reviews and ratings

### Authenticated Users
- Book courts and manage bookings
- Leave reviews and ratings
- Manage profile and preferences

### Venue Owners
- Dashboard with analytics
- Manage venues and courts
- View and manage bookings
- Track earnings and statistics

### Administrators
- System-wide analytics
- Approve/reject venue listings
- Manage users and content
- Handle reports and moderation

## Key Components

### Authentication System
- JWT-based authentication
- Automatic token refresh
- Protected routes by role
- Persistent login state

### Booking Flow
- Multi-step booking process
- Real-time availability checking
- Payment integration ready
- Booking confirmation system

### Search & Filtering
- Advanced search functionality
- Multiple filter options
- Real-time results
- URL-based filter state

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessible design patterns

## API Integration

The frontend integrates with the QuickCourt backend API:

- **Authentication**: Login, register, logout, profile management
- **Venues**: Search, filter, view details, manage venues
- **Bookings**: Create, view, cancel, manage bookings
- **Reviews**: Create, view, manage reviews
- **Analytics**: Dashboard data and statistics

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use TypeScript-style prop validation

### State Management
- Use React Query for server state
- Use Context API for global client state
- Keep component state local when possible
- Implement optimistic updates

### Performance
- Lazy load routes and components
- Implement proper memoization
- Optimize images and assets
- Monitor bundle size

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the established code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of the QuickCourt platform.
