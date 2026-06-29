import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { browserStorage } from '@/lib/browser-storage';

// Define base query with CSRF cookie handling for Laravel Sanctum
const baseQuery = fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
        // Fetch CSRF token from cookie if available
        const token = typeof document !== 'undefined'
            ? document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1]
            : null;

        if (token) {
            headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
        }

        headers.set('Accept', 'application/json');
        
        // Also fetch JWT token from localStorage if fallback token-based authentication is used
        const jwtToken = browserStorage.getItem('token');
        if (jwtToken) {
            headers.set('Authorization', `Bearer ${jwtToken}`);
        }

        return headers;
    },
});

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQuery,
    tagTypes: ['User', 'School', 'Student', 'Examination', 'Marks', 'Result'],
    endpoints: () => ({}),
});
