const { extractToken, verifyToken } = require('./auth-utils');

/**
 * Middleware to authenticate requests using JWT
 * Adds user data to req.user if authentication is successful
 */
async function authenticateRequest(req) {
  const token = extractToken(req);

  if (!token) {
    return {
      authenticated: false,
      error: 'No authentication token provided'
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      authenticated: false,
      error: 'Invalid or expired token'
    };
  }

  return {
    authenticated: true,
    user: {
      userId: decoded.userId,
      email: decoded.email
    }
  };
}

module.exports = {
  authenticateRequest
};
