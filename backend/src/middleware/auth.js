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
    const userRes = await db.query(
      'SELECT id, email, role, is_blocked FROM users WHERE id = $1',
      [decoded.userId]
    );

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

    req.user = {
      ...user,
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
