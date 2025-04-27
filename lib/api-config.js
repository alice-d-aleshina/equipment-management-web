/**
 * API Configuration
 * This file defines the base URL for the API endpoints and
 * provides utility functions for accessing the API.
 */

// Load the API URL from environment variables with a fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get the URL for a specific API endpoint
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}/${endpoint}`;
};

// Function to check if the Arduino server is available
export const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    return response.ok;
  } catch (error) {
    console.error('API connectivity error:', error);
    return false;
  }
}; 