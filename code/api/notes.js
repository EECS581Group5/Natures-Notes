const pool = require('./db');
const { authenticateRequest } = require('./auth-middleware');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      // Fetch all notes for the authenticated user
      const result = await pool.query(
        'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      // Create a new note for the authenticated user
      const { title, content } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await pool.query(
        'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
        [userId, title, content]
      );
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      // Update a note (must belong to the authenticated user)
      const { id, title, content } = req.body;

      if (!id || !title) {
        return res.status(400).json({ error: 'Note ID and title are required' });
      }

      const result = await pool.query(
        'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
        [title, content, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Note not found or unauthorized' });
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      // Delete a note (must belong to the authenticated user)
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Note ID is required' });
      }

      const result = await pool.query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Note not found or unauthorized' });
      }

      res.status(200).json({ message: 'Note deleted successfully', note: result.rows[0] });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling notes request:', error);
    res.status(500).json({ error: error.message });
  }
};
