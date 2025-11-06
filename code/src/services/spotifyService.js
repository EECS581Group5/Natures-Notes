import { getToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Initiate Spotify OAuth login
 */
export async function initiateSpotifyLogin() {
  const response = await fetch(`${API_URL}/api/spotify/login`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to initiate Spotify login');
  }

  const data = await response.json();
  // Open Spotify authorization in new window
  window.location.href = data.authUrl;
}

/**
 * Get Spotify access token (refreshes automatically if needed)
 */
export async function getAccessToken() {
  const response = await fetch(`${API_URL}/api/spotify/token`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('SPOTIFY_NOT_CONNECTED');
    }
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Check if Spotify is connected
 */
export async function checkConnectionStatus() {
  try {
    const response = await fetch(`${API_URL}/api/spotify/status`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      return { connected: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return { connected: false };
  }
}

/**
 * Disconnect Spotify account
 */
export async function disconnectSpotify() {
  const response = await fetch(`${API_URL}/api/spotify/disconnect`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Spotify');
  }

  return await response.json();
}

/**
 * Get user's Spotify playlists
 */
export async function getUserPlaylists() {
  const response = await fetch(`${API_URL}/api/spotify/playlists`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to get playlists');
  }

  return await response.json();
}

/**
 * Search for Spotify playlists
 */
export async function searchPlaylists(query) {
  const response = await fetch(
    `${API_URL}/api/spotify/search/playlists?q=${encodeURIComponent(query)}`,
    {
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search playlists');
  }

  return await response.json();
}

/**
 * Get playlist details
 */
export async function getPlaylist(playlistId) {
  const response = await fetch(`${API_URL}/api/spotify/playlist/${playlistId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to get playlist');
  }

  return await response.json();
}

/**
 * Get all weather-to-playlist mappings
 */
export async function getWeatherPlaylistMappings() {
  const response = await fetch(`${API_URL}/api/weather-playlists`);

  if (!response.ok) {
    throw new Error('Failed to get playlist mappings');
  }

  return await response.json();
}

/**
 * Get playlist for specific weather condition
 */
export async function getPlaylistForWeather(weatherCondition) {
  const response = await fetch(`${API_URL}/api/weather-playlists/${weatherCondition}`);

  if (response.status === 404) {
    return null; // No playlist mapped
  }

  if (!response.ok) {
    throw new Error('Failed to get playlist for weather');
  }

  return await response.json();
}

/**
 * Set/Update playlist mapping for weather condition
 */
export async function setWeatherPlaylistMapping(weatherCondition, playlistId, playlistName, playlistImage) {
  const response = await fetch(`${API_URL}/api/weather-playlists`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      weather_condition: weatherCondition,
      spotify_playlist_id: playlistId,
      playlist_name: playlistName,
      playlist_image: playlistImage
    })
  });

  if (!response.ok) {
    throw new Error('Failed to set playlist mapping');
  }

  return await response.json();
}

/**
 * Delete playlist mapping for weather condition
 */
export async function deleteWeatherPlaylistMapping(weatherCondition) {
  const response = await fetch(`${API_URL}/api/weather-playlists/${weatherCondition}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete playlist mapping');
  }

  return await response.json();
}

const spotifyService = {
  initiateSpotifyLogin,
  getAccessToken,
  checkConnectionStatus,
  disconnectSpotify,
  getUserPlaylists,
  searchPlaylists,
  getPlaylist,
  getWeatherPlaylistMappings,
  getPlaylistForWeather,
  setWeatherPlaylistMapping,
  deleteWeatherPlaylistMapping
};

export default spotifyService;
