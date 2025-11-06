const querystring = require('querystring');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Scopes needed for the app
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming'
].join(' ');

/**
 * Generate Spotify authorization URL
 */
function getAuthorizationUrl(state) {
  const params = querystring.stringify({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state: state,
    show_dialog: true
  });

  return `${SPOTIFY_AUTH_URL}?${params}`;
}

/**
 * Exchange authorization code for access token
 */
async function getAccessToken(code) {
  const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return await response.json();
}

/**
 * Get user's Spotify profile
 */
async function getUserProfile(accessToken) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  return await response.json();
}

/**
 * Get user's playlists
 */
async function getUserPlaylists(accessToken, limit = 50, offset = 0) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get user playlists');
  }

  return await response.json();
}

/**
 * Search for playlists
 */
async function searchPlaylists(accessToken, query, limit = 20) {
  const params = querystring.stringify({
    q: query,
    type: 'playlist',
    limit: limit
  });

  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search playlists');
  }

  return await response.json();
}

/**
 * Get playlist details and tracks
 */
async function getPlaylist(accessToken, playlistId) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get playlist');
  }

  return await response.json();
}

/**
 * Start/Resume playback
 */
async function startPlayback(accessToken, contextUri = null, uris = null, deviceId = null) {
  const body = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris) body.uris = uris;

  const url = deviceId
    ? `${SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`
    : `${SPOTIFY_API_BASE}/me/player/play`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to start playback: ${error}`);
  }

  return { success: true };
}

/**
 * Pause playback
 */
async function pausePlayback(accessToken, deviceId = null) {
  const url = deviceId
    ? `${SPOTIFY_API_BASE}/me/player/pause?device_id=${deviceId}`
    : `${SPOTIFY_API_BASE}/me/player/pause`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to pause playback');
  }

  return { success: true };
}

/**
 * Skip to next track
 */
async function skipToNext(accessToken, deviceId = null) {
  const url = deviceId
    ? `${SPOTIFY_API_BASE}/me/player/next?device_id=${deviceId}`
    : `${SPOTIFY_API_BASE}/me/player/next`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to skip to next track');
  }

  return { success: true };
}

/**
 * Skip to previous track
 */
async function skipToPrevious(accessToken, deviceId = null) {
  const url = deviceId
    ? `${SPOTIFY_API_BASE}/me/player/previous?device_id=${deviceId}`
    : `${SPOTIFY_API_BASE}/me/player/previous`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to skip to previous track');
  }

  return { success: true };
}

/**
 * Get currently playing track
 */
async function getCurrentlyPlaying(accessToken) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/player/currently-playing`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 204) {
    return null; // Nothing playing
  }

  if (!response.ok) {
    throw new Error('Failed to get currently playing track');
  }

  return await response.json();
}

/**
 * Get user's available devices
 */
async function getDevices(accessToken) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/player/devices`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get devices');
  }

  return await response.json();
}

module.exports = {
  getAuthorizationUrl,
  getAccessToken,
  refreshAccessToken,
  getUserProfile,
  getUserPlaylists,
  searchPlaylists,
  getPlaylist,
  startPlayback,
  pausePlayback,
  skipToNext,
  skipToPrevious,
  getCurrentlyPlaying,
  getDevices
};
