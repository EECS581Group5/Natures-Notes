const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const spotifyService = require('./spotifyService');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, username, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, username, created_at',
      [email, passwordHash, username]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Notes API routes (protected)
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [req.user.userId, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Recent Locations API routes (protected)
// Get user's recent locations (up to 3 most recent)
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, latitude, longitude, city_name, country_code, accessed_at FROM user_recent_locations WHERE user_id = $1 ORDER BY accessed_at DESC LIMIT 3',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent locations:', error);
    res.status(500).json({ error: 'Failed to fetch recent locations' });
  }
});

// Add or update a recent location
app.post('/api/locations', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, city_name, country_code } = req.body;

    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    // Insert new location
    await pool.query(
      'INSERT INTO user_recent_locations (user_id, latitude, longitude, city_name, country_code, accessed_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [req.user.userId, latitude, longitude, city_name || null, country_code || null]
    );

    // Delete locations beyond the 3 most recent
    await pool.query(
      `DELETE FROM user_recent_locations
       WHERE id IN (
         SELECT id FROM user_recent_locations
         WHERE user_id = $1
         ORDER BY accessed_at DESC
         OFFSET 3
       )`,
      [req.user.userId]
    );

    // Fetch and return the updated recent locations
    const result = await pool.query(
      'SELECT id, latitude, longitude, city_name, country_code, accessed_at FROM user_recent_locations WHERE user_id = $1 ORDER BY accessed_at DESC LIMIT 3',
      [req.user.userId]
    );

    res.status(201).json(result.rows);
  } catch (error) {
    console.error('Error adding recent location:', error);
    res.status(500).json({ error: 'Failed to add recent location' });
  }
});

// Spotify API routes
// Initiate Spotify OAuth flow
app.get('/api/spotify/login', authenticateToken, (req, res) => {
  try {
    // Use user ID as state parameter for security
    const state = req.user.userId.toString();
    const authUrl = spotifyService.getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (error) {
    console.error('Spotify login error:', error);
    res.status(500).json({ error: 'Failed to initiate Spotify login' });
  }
});

// Spotify OAuth callback
app.get('/api/spotify/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify_error=${error}`);
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // Exchange code for tokens
    const tokenData = await spotifyService.getAccessToken(code);

    // Get user profile
    const profile = await spotifyService.getUserProfile(tokenData.access_token);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Store tokens in database
    const userId = parseInt(state);
    const existingToken = await pool.query(
      'SELECT id FROM user_spotify_tokens WHERE user_id = $1',
      [userId]
    );

    if (existingToken.rows.length > 0) {
      // Update existing token
      await pool.query(
        `UPDATE user_spotify_tokens
         SET spotify_user_id = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
         WHERE user_id = $4`,
        [profile.id, tokenData.refresh_token, expiresAt, userId]
      );
    } else {
      // Insert new token
      await pool.query(
        `INSERT INTO user_spotify_tokens
         (user_id, spotify_user_id, refresh_token, token_expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [userId, profile.id, tokenData.refresh_token, expiresAt]
      );
    }

    // Redirect back to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify_connected=true`);
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify_error=callback_failed`);
  }
});

// Get or refresh access token
app.get('/api/spotify/token', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT refresh_token, token_expires_at FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spotify not connected' });
    }

    const { refresh_token, token_expires_at } = result.rows[0];

    // Refresh the token
    const tokenData = await spotifyService.refreshAccessToken(refresh_token);

    // Update expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    await pool.query(
      'UPDATE user_spotify_tokens SET token_expires_at = $1, updated_at = NOW() WHERE user_id = $2',
      [expiresAt, req.user.userId]
    );

    res.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Check Spotify connection status
app.get('/api/spotify/status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT spotify_user_id, created_at FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      connected: result.rows.length > 0,
      spotifyUserId: result.rows.length > 0 ? result.rows[0].spotify_user_id : null
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Disconnect Spotify
app.delete('/api/spotify/disconnect', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );
    res.json({ message: 'Spotify disconnected successfully' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Spotify' });
  }
});

// Get user's playlists
app.get('/api/spotify/playlists', authenticateToken, async (req, res) => {
  try {
    const tokenResult = await pool.query(
      'SELECT refresh_token FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spotify not connected' });
    }

    const tokenData = await spotifyService.refreshAccessToken(tokenResult.rows[0].refresh_token);
    const playlists = await spotifyService.getUserPlaylists(tokenData.access_token);

    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Search playlists
app.get('/api/spotify/search/playlists', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const tokenResult = await pool.query(
      'SELECT refresh_token FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spotify not connected' });
    }

    const tokenData = await spotifyService.refreshAccessToken(tokenResult.rows[0].refresh_token);
    const results = await spotifyService.searchPlaylists(tokenData.access_token, q);

    res.json(results);
  } catch (error) {
    console.error('Search playlists error:', error);
    res.status(500).json({ error: 'Failed to search playlists' });
  }
});

// Get playlist details
app.get('/api/spotify/playlist/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const tokenResult = await pool.query(
      'SELECT refresh_token FROM user_spotify_tokens WHERE user_id = $1',
      [req.user.userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spotify not connected' });
    }

    const tokenData = await spotifyService.refreshAccessToken(tokenResult.rows[0].refresh_token);
    const playlist = await spotifyService.getPlaylist(tokenData.access_token, id);

    res.json(playlist);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

// Weather to Playlist Mapping routes
// Get all weather playlist mappings
app.get('/api/weather-playlists', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM weather_spotify_playlists ORDER BY weather_condition'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({ error: 'Failed to get playlist mappings' });
  }
});

// Get playlist for specific weather condition
app.get('/api/weather-playlists/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    const result = await pool.query(
      'SELECT * FROM weather_spotify_playlists WHERE weather_condition = $1',
      [condition]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No playlist mapped for this weather condition' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get mapping error:', error);
    res.status(500).json({ error: 'Failed to get playlist mapping' });
  }
});

// Set/Update playlist for weather condition
app.post('/api/weather-playlists', authenticateToken, async (req, res) => {
  try {
    const { weather_condition, spotify_playlist_id, playlist_name, playlist_image } = req.body;

    if (!weather_condition || !spotify_playlist_id) {
      return res.status(400).json({ error: 'Weather condition and playlist ID required' });
    }

    // Check if mapping exists
    const existing = await pool.query(
      'SELECT id FROM weather_spotify_playlists WHERE weather_condition = $1',
      [weather_condition]
    );

    if (existing.rows.length > 0) {
      // Update existing mapping
      const result = await pool.query(
        `UPDATE weather_spotify_playlists
         SET spotify_playlist_id = $1, playlist_name = $2, playlist_image = $3, updated_at = NOW()
         WHERE weather_condition = $4
         RETURNING *`,
        [spotify_playlist_id, playlist_name, playlist_image, weather_condition]
      );
      res.json(result.rows[0]);
    } else {
      // Insert new mapping
      const result = await pool.query(
        `INSERT INTO weather_spotify_playlists
         (weather_condition, spotify_playlist_id, playlist_name, playlist_image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [weather_condition, spotify_playlist_id, playlist_name, playlist_image]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Set mapping error:', error);
    res.status(500).json({ error: 'Failed to set playlist mapping' });
  }
});

// Delete playlist mapping
app.delete('/api/weather-playlists/:condition', authenticateToken, async (req, res) => {
  try {
    const { condition } = req.params;
    const result = await pool.query(
      'DELETE FROM weather_spotify_playlists WHERE weather_condition = $1 RETURNING *',
      [condition]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    res.json({ message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('Delete mapping error:', error);
    res.status(500).json({ error: 'Failed to delete mapping' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
