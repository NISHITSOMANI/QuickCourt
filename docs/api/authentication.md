# Authentication API

## Base URL
```
/api/v1/auth
```

## Endpoints

### Register a New User
- **URL**: `/register`
- **Method**: `POST`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "phone": "+1234567890"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully. Please verify your email.",
    "data": {
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "isVerified": false,
        "role": "user"
      }
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input data
  - 409: Email already registered
  - 500: Server error

### Login
- **URL**: `/login`
- **Method**: `POST`
- **Description**: Authenticate user and return JWT token
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid credentials
  - 401: Email not verified
  - 404: User not found
  - 500: Server error

### Verify Email with OTP
- **URL**: `/verify-email`
- **Method**: `POST`
- **Description**: Verify user's email using OTP
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Email verified successfully"
  }
  ```
- **Error Responses**:
  - 400: Invalid OTP or expired
  - 404: User not found
  - 500: Server error

### Forgot Password
- **URL**: `/forgot-password`
- **Method**: `POST`
- **Description**: Request password reset OTP
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Password reset OTP sent to email"
  }
  ```
- **Error Responses**:
  - 404: User not found
  - 500: Server error

### Reset Password
- **URL**: `/reset-password`
- **Method**: `POST`
- **Description**: Reset password using OTP
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "newSecurePassword123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Password reset successful"
  }
  ```
- **Error Responses**:
  - 400: Invalid or expired OTP
  - 404: User not found
  - 500: Server error

### Get Current User
- **URL**: `/me`
- **Method**: `GET`
- **Description**: Get current authenticated user's profile
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "isVerified": true,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - 401: Unauthorized
  - 500: Server error
