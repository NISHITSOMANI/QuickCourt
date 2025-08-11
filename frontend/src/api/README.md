# API Utilities

This directory contains all the API-related utilities and configurations for the QuickCourt frontend application. It provides a consistent way to interact with the backend API, handle errors, and manage API requests.

## Table of Contents

- [API Client](#api-client)
- [Error Handling](#error-handling)
- [API Hooks](#api-hooks)
- [Available APIs](#available-apis)
- [Mock API](#mock-api)
- [Best Practices](#best-practices)

## API Client

The API client is configured in `config.js` and provides the following features:

- Automatic JWT token handling
- Request/response interceptors
- Error handling and transformation
- Support for file uploads
- Request timeouts and retries

### Usage

```javascript
import api from './api/config';

// Making a GET request
const response = await api.get('/endpoint');

// Making a POST request with data
const response = await api.post('/endpoint', { key: 'value' });

// Uploading files
const formData = new FormData();
formData.append('file', file);
const response = await api.post('/upload', formData);
```

## Error Handling

The `apiErrorHandler.js` utility provides consistent error handling across the application:

### Basic Usage

```javascript
import { handleApiError } from '../utils/apiErrorHandler';

try {
  await api.get('/some-endpoint');
} catch (error) {
  const errorInfo = handleApiError(error, {
    showToast: true,
    defaultMessage: 'Failed to load data',
  });
  
  // Handle specific error cases
  if (errorInfo.status === 404) {
    // Handle not found
  }
}
```

### With React Components

```javascript
import { useApiErrorHandler } from '../utils/apiErrorHandler';

function MyComponent() {
  const handleError = useApiErrorHandler();
  
  const fetchData = async () => {
    try {
      const data = await api.get('/data');
      // Handle success
    } catch (error) {
      handleError(error, {
        onError: (error) => {
          // Custom error handling
        }
      });
    }
  };
  
  // ...
}
```

## API Hooks

The `useApiRequest` hook simplifies data fetching in React components:

```javascript
import useApiRequest from '../hooks/useApiRequest';
import { userApi } from '../api';

function UserProfile({ userId }) {
  const { 
    data: user, 
    error, 
    isLoading, 
    execute: fetchUser 
  } = useApiRequest(
    () => userApi.getUser(userId),
    {
      onSuccess: (data) => console.log('User loaded:', data),
      onError: (error) => console.error('Failed to load user:', error),
      showErrorToast: true,
    }
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## Available APIs

### Auth API (`authApi.js`)
- User authentication (login, register, logout)
- Password reset and recovery
- Session management

### User API (`userApi.js`)
- User profile management
- Account settings
- User preferences

### Venue API (`venueApi.js`)
- Fetch venues
- Venue details
- Venue search and filtering

### Booking API (`bookingApi.js`)
- Create and manage bookings
- Booking history
- Availability checking

### Review API (`reviewApi.js`)
- Submit and manage reviews
- Fetch venue reviews
- Review ratings and comments

## Mock API

For development and testing, a mock API is available. It can be enabled by setting `VITE_USE_MOCK_API=true` in your `.env` file.

### Mock Data

Mock data is defined in `src/utils/mockData.js`. You can extend this file to add more test data as needed.

## Best Practices

1. **Use the API Hooks**: Prefer using `useApiRequest` in components for consistent data fetching.

2. **Handle Loading States**: Always handle loading and error states in your components.

3. **Error Boundaries**: Wrap your app with an error boundary to catch and handle unexpected errors.

4. **Type Safety**: Consider using TypeScript for better type safety when working with API responses.

5. **Pagination**: For large datasets, implement pagination to improve performance.

6. **Caching**: Use React Query or similar libraries for efficient data caching and synchronization.

7. **Rate Limiting**: Be mindful of API rate limits and implement appropriate retry logic.

8. **Security**: Never expose API keys or sensitive information in client-side code.

## Environment Variables

- `VITE_API_URL`: Base URL for the API (default: `http://localhost:5000/api/v1`)
- `VITE_USE_MOCK_API`: Set to `true` to use mock data (default: `false` in production, `true` in development)

## Troubleshooting

- **CORS Issues**: Ensure your backend is configured to accept requests from your frontend domain.
- **Authentication Errors**: Verify that tokens are being stored and sent correctly.
- **Network Errors**: Check your internet connection and make sure the backend server is running.
- **Unexpected Errors**: Check the browser console for detailed error messages and stack traces.
