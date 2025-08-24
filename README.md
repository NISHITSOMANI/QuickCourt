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



## User Roles

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

## API Endpoints

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

## Acknowledgments

- Built with modern web technologies
- Inspired by the need for easy sports venue booking
- Thanks to all contributors and users
