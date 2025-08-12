# Booking API

## Base URL
```
/api/v1/bookings
```

## Endpoints

### Create a New Booking
- **URL**: `/`
- **Method**: `POST`
- **Description**: Create a new court booking
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "venueId": "507f1f77bcf86cd799439011",
    "courtId": "507f1f77bcf86cd799439012",
    "date": "2023-12-25",
    "startTime": "10:00",
    "endTime": "11:30",
    "players": 4,
    "notes": "Court near the entrance please"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": {
      "booking": {
        "_id": "608b9c8e9dc1d026b0f4b2a1",
        "user": "507f1f77bcf86cd799439011",
        "venue": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Downtown Sports Center"
        },
        "court": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Court 1",
          "sport": "Badminton"
        },
        "date": "2023-12-25T00:00:00.000Z",
        "startTime": "10:00",
        "endTime": "11:30",
        "duration": 90,
        "players": 4,
        "status": "confirmed",
        "paymentStatus": "pending",
        "totalAmount": 45.00,
        "createdAt": "2023-12-01T10:30:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input data
  - 401: Unauthorized
  - 403: Time slot not available
  - 404: Venue or court not found
  - 500: Server error

### Get User Bookings
- **URL**: `/my-bookings`
- **Method**: `GET`
- **Description**: Get all bookings for the authenticated user
- **Headers**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: Filter by status (pending/confirmed/completed/cancelled)
  - `from`: Filter by start date (YYYY-MM-DD)
  - `to`: Filter by end date (YYYY-MM-DD)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "count": 5,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "itemsPerPage": 10
    },
    "data": [
      {
        "_id": "608b9c8e9dc1d026b0f4b2a1",
        "venue": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Downtown Sports Center",
          "location": "123 Main St"
        },
        "court": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Court 1",
          "sport": "Badminton"
        },
        "date": "2023-12-25T00:00:00.000Z",
        "startTime": "10:00",
        "endTime": "11:30",
        "status": "confirmed",
        "paymentStatus": "paid",
        "totalAmount": 45.00
      }
    ]
  }
  ```

### Get Booking by ID
- **URL**: `/:id`
d- **Method**: `GET`
- **Description**: Get booking details by ID
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "608b9c8e9dc1d026b0f4b2a1",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "venue": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Downtown Sports Center",
        "location": "123 Main St"
      },
      "court": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Court 1",
        "sport": "Badminton"
      },
      "date": "2023-12-25T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "11:30",
      "duration": 90,
      "players": 4,
      "status": "confirmed",
      "paymentStatus": "paid",
      "totalAmount": 45.00,
      "createdAt": "2023-12-01T10:30:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - 401: Unauthorized
  - 403: Not authorized to view this booking
  - 404: Booking not found
  - 500: Server error

### Cancel a Booking
- **URL**: `/:id/cancel`
- **Method**: `PATCH`
- **Description**: Cancel a booking
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully",
    "data": {
      "_id": "608b9c8e9dc1d026b0f4b2a1",
      "status": "cancelled"
    }
  }
  ```
- **Error Responses**:
  - 400: Cannot cancel a completed or already cancelled booking
  - 401: Unauthorized
  - 403: Not authorized to cancel this booking
  - 404: Booking not found
  - 500: Server error
