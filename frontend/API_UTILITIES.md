# QuickCourt Frontend API Utilities

This document provides an overview of the API utilities used in the QuickCourt frontend application. These utilities are designed to handle common API-related tasks such as request/response handling, error management, caching, and more.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Available Utilities](#available-utilities)
  - [API Configuration](#api-configuration)
  - [Error Handling](#error-handling)
  - [Request Caching](#request-caching)
  - [Request Retry](#request-retry)
  - [Request Cancellation](#request-cancellation)
  - [Rate Limiting](#rate-limiting)
  - [Logging](#logging)
  - [Data Transformation](#data-transformation)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The QuickCourt frontend includes a comprehensive set of API utilities that work together to provide a robust and consistent way to interact with the backend API. These utilities are built on top of Axios and provide additional functionality such as:

- Automatic token management and refresh
- Request/response caching
- Automatic retry of failed requests
- Request cancellation
- Rate limiting and throttling
- Comprehensive error handling
- Request/response logging
- Data transformation and normalization

## Installation

All API utilities are included in the QuickCourt frontend project. No additional installation is required.

## Available Utilities

### API Configuration

Location: `src/api/config.js`

The main configuration file for the API client. It sets up the Axios instance with default settings and includes interceptors for various functionalities.

Key features:
- Base URL configuration
- Default headers
- Request/response interceptors
- Token management
- Error handling

### Error Handling

Location: `src/utils/apiErrorHandler.js`

Provides utilities for handling API errors in a consistent way across the application.

Key features:
- Standardized error format
- Error logging
- User-friendly error messages
- Error boundary support for React components

### Request Caching

Location: `src/utils/apiCache.js`

Implements an in-memory cache for API responses to improve performance and reduce network requests.

Key features:
- Time-based cache expiration
- Cache invalidation
- Support for different cache strategies
- Integration with Axios interceptors

### Request Retry

Location: `src/utils/retryRequest.js`

Provides automatic retry functionality for failed API requests.

Key features:
- Configurable retry count and delays
- Exponential backoff with jitter
- Custom retry conditions
- Integration with Axios interceptors

### Request Cancellation

Location: `src/utils/apiCancellation.js`

Allows for cancellation of in-flight API requests.

Key features:
- Cancel requests when components unmount
- Cancel previous requests when making new ones
- React hook for easy integration
- Support for request deduplication

### Rate Limiting

Location: `src/utils/apiRateLimiter.js`

Implements client-side rate limiting to prevent hitting API rate limits.

Key features:
- Configurable rate limits
- Support for different rate limiting strategies
- Automatic retry after rate limit resets
- Integration with Axios interceptors

### Logging

Location: `src/utils/apiLogger.js`

Provides request and response logging for debugging and monitoring.

Key features:
- Configurable log levels
- Request/response logging
- Sensitive data redaction
- Integration with Axios interceptors

### Data Transformation

Location: `src/utils/apiTransformers.js`

Provides functions for transforming API responses into a consistent format.

Key features:
- Data normalization
- Type conversion
- Default value handling
- Support for paginated responses

## Usage Examples

### Making API Requests

```javascript
import api from './api/config';

// GET request
const fetchVenues = async () => {
  try {
    const response = await api.get('/venues');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch venues:', error);
    throw error;
  }
};

// POST request
const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
};
```

### Using the useApiRequest Hook

```jsx
import { useApiRequest } from '../hooks/useApiRequest';

function VenueList() {
  const { data: venues, loading, error } = useApiRequest('/venues');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {venues.map(venue => (
        <li key={venue.id}>{venue.name}</li>
      ))}
    </ul>
  );
}
```

### Handling Errors

```javascript
import { handleApiError } from '../utils/apiErrorHandler';

async function fetchUserProfile(userId) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, {
      401: 'Please log in to view this page',
      404: 'User not found',
      default: 'Failed to load user profile'
    });
    throw error;
  }
}
```

## Best Practices

1. **Use the API Client Consistently**
   - Always use the configured `api` instance from `src/api/config.js` instead of making direct fetch calls.

2. **Handle Errors Gracefully**
   - Always wrap API calls in try/catch blocks.
   - Use the error handling utilities to provide meaningful error messages to users.

3. **Use the useApiRequest Hook**
   - For React components, use the `useApiRequest` hook to handle loading and error states.

4. **Cache When Appropriate**
   - Use the caching utilities for data that doesn't change frequently.
   - Be mindful of cache invalidation when data is updated.

5. **Cancel Unnecessary Requests**
   - Use the cancellation utilities to cancel requests when components unmount or when making new requests.

6. **Be Mindful of Rate Limits**
   - Be aware of the API's rate limits and use the rate limiting utilities to stay within them.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the backend is properly configured to accept requests from your frontend's origin.
   - Check that the `VITE_API_URL` environment variable is set correctly.

2. **Authentication Issues**
   - Make sure the user is properly authenticated before making authenticated requests.
   - Check that the authentication token is being included in requests.

3. **Rate Limiting**
   - If you're hitting rate limits, consider implementing client-side rate limiting or optimizing your API usage.

4. **Request Timeouts**
   - If requests are timing out, you may need to adjust the timeout value in the API configuration.

### Debugging

To enable debug logging, set the following environment variable:

```bash
VITE_DEBUG_API=true
```

This will log detailed information about API requests and responses to the console.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
