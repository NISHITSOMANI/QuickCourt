# QuickCourt - Sports Venue Booking Platform

A modern, full-stack web application for booking sports courts and managing venues. Built with Node.js, Express, MongoDB, React, and Tailwind CSS.

## Features

### For Users
- **Browse & Search**: Find sports venues by location, sport type, and availability
- **Easy Booking**: Book courts with real-time availability checking
- **Profile Management**: Manage bookings, reviews, and personal information
- **Reviews & Ratings**: Rate and review venues after visits

### For Venue Owners
- **Venue Management**: Add and manage multiple sports venues
- **Court Management**: Configure courts, pricing, and availability
- **Booking Management**: View, confirm, and manage bookings
- **Analytics Dashboard**: Track revenue, bookings, and performance

### For Administrators
- **Platform Management**: Oversee all venues and users
- **Approval System**: Review and approve new venue listings
- **User Management**: Manage user accounts and permissions
- **System Analytics**: Monitor platform-wide statistics

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File uploads
- **Nodemailer** - Email services

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - State management
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Axios** - HTTP client

## 📁 Project Structure

```
QuickCourt/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── uploads/            # File uploads
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── api/            # API layer
│   │   ├── routes/         # Routing configuration
│   │   └── styles/         # Global styles
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd QuickCourt
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env file
   echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
   
   # Start the development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quickcourt
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 📱 User Roles

### User (Player)
- Browse and search venues
- Book courts and manage bookings
- Leave reviews and ratings
- Manage profile and preferences

### Owner (Venue Owner)
- Register and manage venues
- Add and configure courts
- Set pricing and availability
- View bookings and analytics
- Manage venue information

### Admin (Platform Administrator)
- Approve/reject venue applications
- Manage all users and venues
- View platform analytics
- Handle reports and disputes
- System configuration

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout

### Venues
- `GET /api/v1/venues` - Get all venues
- `GET /api/v1/venues/:id` - Get venue by ID
- `POST /api/v1/venues` - Create venue (owner)
- `PUT /api/v1/venues/:id` - Update venue (owner)

### Bookings
- `GET /api/v1/bookings/my` - Get user bookings
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@quickcourt.com or create an issue in this repository.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for easy sports venue booking
- Thanks to all contributors and users
