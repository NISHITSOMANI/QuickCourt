# Payment API

## Base URL
```
/api/v1/payments
```

## Endpoints

### Initiate Payment
- **URL**: `/initiate`
- **Method**: `POST`
- **Description**: Initiate a payment for a booking
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "bookingId": "608b9c8e9dc1d026b0f4b2a1",
    "paymentMethod": "card",
    "amount": 45.00
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Payment initiated successfully",
    "data": {
      "paymentId": "pay_1234567890",
      "amount": 45.00,
      "currency": "USD",
      "status": "pending",
      "paymentMethod": "card",
      "bookingId": "608b9c8e9dc1d026b0f4b2a1",
      "clientSecret": "pi_1234567890_secret_abcdefghijkl"
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input data
  - 401: Unauthorized
  - 403: Payment already processed
  - 404: Booking not found
  - 500: Payment processing failed

### Verify Payment
- **URL**: `/verify`
- **Method**: `POST`
- **Description**: Verify a completed payment
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "paymentId": "pay_1234567890",
    "bookingId": "608b9c8e9dc1d026b0f4b2a1"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "data": {
      "paymentId": "pay_1234567890",
      "status": "succeeded",
      "bookingId": "608b9c8e9dc1d026b0f4b2a1",
      "receiptUrl": "https://example.com/receipts/123"
    }
  }
  ```
- **Error Responses**:
  - 400: Payment verification failed
  - 401: Unauthorized
  - 404: Payment not found
  - 500: Server error

### Get Payment Details
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get payment details by ID
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "pay_1234567890",
      "bookingId": "608b9c8e9dc1d026b0f4b2a1",
      "amount": 45.00,
      "currency": "USD",
      "status": "succeeded",
      "paymentMethod": "card",
      "receiptUrl": "https://example.com/receipts/123",
      "createdAt": "2023-12-01T10:30:00.000Z",
      "updatedAt": "2023-12-01T10:32:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - 401: Unauthorized
  - 403: Not authorized to view this payment
  - 404: Payment not found
  - 500: Server error

### Process Payment Webhook
- **URL**: `/webhook`
- **Method**: `POST`
- **Description**: Webhook for payment gateway callbacks
- **Headers**:
  - `Content-Type: application/json`
  - `X-Webhook-Signature: <signature>`
- **Request Body**:
  ```json
  {
    "id": "evt_1234567890",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_1234567890",
        "amount": 4500,
        "currency": "usd",
        "status": "succeeded",
        "metadata": {
          "bookingId": "608b9c8e9dc1d026b0f4b2a1"
        }
      }
    }
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Webhook processed successfully"
  }
  ```
- **Error Responses**:
  - 400: Invalid webhook payload
  - 401: Invalid signature
  - 500: Webhook processing failed
