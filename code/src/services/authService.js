// Authentication service for API calls

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Register a new user
 */
export async function register(email, password, username) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, username })
    });

    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API endpoint not available. Please ensure the backend is deployed.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Login user
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API endpoint not available. Please ensure the backend is deployed.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Get authentication token
 */
export function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Set authentication token and user
 */
export function setAuth(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear authentication
 */
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}
