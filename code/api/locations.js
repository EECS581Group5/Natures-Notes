const pool = require('./db');
const { authenticateRequest } = require('./auth-middleware');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Authenticate the request
  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;

  try {
    if (req.method === 'GET') {
      // Fetch recent locations for the authenticated user (up to 3 most recent)
      const result = await pool.query(
        'SELECT id, latitude, longitude, city_name, country_code, accessed_at FROM user_recent_locations WHERE user_id = $1 ORDER BY accessed_at DESC LIMIT 3',
        [userId]
      );
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      // Add a new recent location for the authenticated user
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
        [userId, latitude, longitude, city_name || null, country_code || null]
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
        [userId]
      );

      // Fetch and return the updated recent locations
      const result = await pool.query(
        'SELECT id, latitude, longitude, city_name, country_code, accessed_at FROM user_recent_locations WHERE user_id = $1 ORDER BY accessed_at DESC LIMIT 3',
        [userId]
      );

      res.status(201).json(result.rows);

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling locations request:', error);
    res.status(500).json({ error: error.message });
  }
};
