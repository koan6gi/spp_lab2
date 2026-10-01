const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_key_change_in_prod';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication token is required.',
      code: 'AUTH_TOKEN_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    let query;
    let params;
    if (decoded.sessionId) {
      query = `
        SELECT u.id, u.email, u.role, u.is_blocked, 
               s.id AS session_id, s.is_revoked, s.expires_at
        FROM users u
        LEFT JOIN sessions s ON s.id = $2 AND s.user_id = u.id
        WHERE u.id = $1
      `;
      params = [decoded.userId, decoded.sessionId];
    } else {
      query = 'SELECT id, email, role, is_blocked FROM users WHERE id = $1';
      params = [decoded.userId];
    }

    const userRes = await db.query(query, params);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: 'User account no longer exists.',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = userRes.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({
        error: 'Your account has been suspended by an administrator.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    if (decoded.sessionId) {
      if (!user.session_id || user.is_revoked || new Date(user.expires_at) < new Date()) {
        return res.status(401).json({
          error: 'Session has been revoked or expired. Please log in again.',
          code: 'SESSION_REVOKED',
        });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId || null,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication token has expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = {
  authenticate,
  JWT_ACCESS_SECRET,
};
