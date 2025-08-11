# QuickCourt Backend API

A comprehensive sports venue booking platform backend built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (user, owner, admin)
- **Venue Management**: Complete CRUD operations for sports venues with photo uploads
- **Court Management**: Individual court booking with availability tracking
- **Booking System**: Real-time booking with distributed locking to prevent conflicts
- **Payment Integration**: Simulated payment processing with webhook support
- **Review System**: User reviews and ratings for venues
- **Admin Panel**: Comprehensive admin features for venue approval and user management
- **Email Notifications**: Transactional emails for bookings, confirmations, etc.
- **File Uploads**: Secure file upload handling with validation
- **Caching**: In-memory caching with Redis migration path
- **Rate Limiting**: Configurable rate limiting for API protection
- **Logging**: Structured logging with request tracing
- **Security**: Comprehensive security middleware (helmet, CORS, sanitization)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, xss-clean
- **Monitoring**: Structured logging with Pino

## Architecture

The backend follows a layered architecture pattern:

```
├── src/
│   ├── config/          # Configuration files (DB, env, logger, cache)
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware (auth, validation, error handling)
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   ├── app.js          # Express app configuration
│   └── server.js       # Server startup
├── tests/              # Test files
└── uploads/           # File upload directory
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QuickCourt/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/quickcourt
   MONGODB_URI_TEST=mongodb://localhost:27017/quickcourt_test
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   
   # Email (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify installation**
   - Health check: http://localhost:5000/api/v1/health
   - API docs: http://localhost:5000/api-docs (development only)

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

#### Venues
- `GET /venues` - List venues with filters
- `POST /venues` - Create venue (owner/admin)
- `GET /venues/:id` - Get venue details
- `PUT /venues/:id` - Update venue (owner/admin)
- `DELETE /venues/:id` - Delete venue (owner/admin)

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/my` - Get user's bookings
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/cancel` - Cancel booking

#### Admin
- `GET /admin/stats` - Admin dashboard statistics
- `GET /admin/facilities/pending` - Pending venue approvals
- `PATCH /admin/facilities/:id/approve` - Approve venue
- `GET /admin/users` - User management

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Detailed error information
  ]
}
```

## Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format code with Prettier
```

### Code Style
- ESLint configuration for Node.js
- Prettier for code formatting
- Pre-commit hooks (if using husky)

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:

- **Database**: `MONGODB_URI`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **Email**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- **CORS**: `CORS_ALLOWED_ORIGINS`
- **File Upload**: `UPLOAD_MAX_SIZE`, `UPLOAD_ALLOWED_TYPES`

### Production Considerations

1. **Database**
   - Use MongoDB Atlas or properly configured MongoDB instance
   - Enable authentication and SSL
   - Set up proper indexes for performance

2. **Security**
   - Use strong JWT secrets
   - Configure CORS properly
   - Enable rate limiting
   - Use HTTPS in production

3. **Monitoring**
   - Set up log aggregation
   - Monitor application metrics
   - Set up health checks

4. **Scaling**
   - Use PM2 or similar process manager
   - Consider load balancing for multiple instances
   - Implement Redis for caching and session storage

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Migration Notes

### Redis Integration
The current implementation uses in-memory alternatives for caching and rate limiting. To migrate to Redis:

1. **Caching**: Replace `src/config/cache.js` with Redis client
2. **Rate Limiting**: Update rate limiting middleware to use Redis store
3. **Distributed Locks**: Replace MongoDB locks with Redis locks
4. **Session Storage**: Use Redis for refresh token storage

### Scaling Considerations
- Implement Redis for distributed caching
- Use message queues for background jobs
- Consider microservices architecture for large scale
- Implement database sharding if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## API Rate Limits

- Global: 1000 requests per 15 minutes per IP
- Auth endpoints: 5 requests per minute per IP
- File uploads: 10 requests per hour per user

## File Upload Limits

- Maximum file size: 5MB per file
- Allowed types: jpg, jpeg, png, pdf
- Maximum files per request: 5

## Database Indexes

The application automatically creates the following indexes:
- User email (unique)
- Venue location (2dsphere for geospatial queries)
- Booking date and time ranges
- Review venue and user references
- Refresh token expiry (TTL index)
- Lock expiry (TTL index)
