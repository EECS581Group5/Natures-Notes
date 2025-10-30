import { getToken } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Fetch up to 3 recent locations for the current user
 */
export async function getRecentLocations() {
  try {
    const token = getToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch recent locations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent locations:', error);
    throw error;
  }
}

/**
 * Save a new location for the current user
 */
export async function addLocation(latitude, longitude) {
  try {
    const token = getToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ latitude, longitude })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add location');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
}
