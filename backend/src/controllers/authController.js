const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendPasswordResetEmail } = require('../config/mail');
const { logger } = require('../config/logger');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_key_change_in_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_key_change_in_prod';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateTokens = (user, sessionId) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
      code: 'REQUIRED_FIELDS_MISSING',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(422).json({
      error: 'Invalid email address format.',
      code: 'INVALID_EMAIL_FORMAT',
    });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(422).json({
      error: 'Password must be at least 6 characters long.',
      code: 'PASSWORD_TOO_SHORT',
    });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role) 
       VALUES ($1, $2, 'user') 
       RETURNING id, email, role, created_at`,
      [normalizedEmail, passwordHash]
    );

    const newUser = userRes.rows[0];

    const sessionRes = await db.query(
      `INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, '', $2, $3, NOW() + INTERVAL '7 days')
       RETURNING id`,
      [newUser.id, req.headers['user-agent'] || 'Unknown', req.ip || 'Unknown']
    );

    const sessionId = sessionRes.rows[0].id;
    const { accessToken, refreshToken } = generateTokens(newUser, sessionId);

    await db.query(
      'UPDATE sessions SET refresh_token_hash = $1 WHERE id = $2',
      [hashToken(refreshToken), sessionId]
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Registration error');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
      code: 'REQUIRED_FIELDS_MISSING',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const userRes = await db.query(
      'SELECT id, email, password_hash, role, is_blocked, failed_login_attempts, lockout_until FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const user = userRes.rows[0];

    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        code: 'ACCOUNT_TEMPORARILY_LOCKED',
        lockoutMinutesRemaining: remainingMinutes,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const attempts = user.failed_login_attempts + 1;
      let lockoutClause = '';
      const params = [attempts, user.id];

      if (attempts >= 5) {
        lockoutClause = ", lockout_until = NOW() + INTERVAL '15 minutes'";
      }

      await db.query(`UPDATE users SET failed_login_attempts = $1${lockoutClause} WHERE id = $2`, params);

      if (attempts >= 5) {
        return res.status(429).json({
          error: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
          code: 'ACCOUNT_TEMPORARILY_LOCKED',
          lockoutMinutesRemaining: 15,
        });
      }

      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: 5 - attempts,
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        error: 'Your account has been suspended by an administrator.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    await db.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    const sessionRes = await db.query(
      `INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, '', $2, $3, NOW() + INTERVAL '7 days')
       RETURNING id`,
      [user.id, req.headers['user-agent'] || 'Unknown', req.ip || 'Unknown']
    );

    const sessionId = sessionRes.rows[0].id;
    const { accessToken, refreshToken } = generateTokens(user, sessionId);

    await db.query(
      'UPDATE sessions SET refresh_token_hash = $1 WHERE id = $2',
      [hashToken(refreshToken), sessionId]
    );

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Login error');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'Refresh token is required.',
      code: 'REFRESH_TOKEN_REQUIRED',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const hashed = hashToken(refreshToken);

    const sessionRes = await db.query(
      `SELECT s.id, s.user_id, s.is_revoked, s.expires_at, u.email, u.role, u.is_blocked 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1 AND s.refresh_token_hash = $2`,
      [decoded.sessionId, hashed]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid session or token.',
        code: 'INVALID_SESSION',
      });
    }

    const session = sessionRes.rows[0];

    if (session.is_revoked || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Session has expired or was revoked. Please log in again.',
        code: 'SESSION_REVOKED',
      });
    }

    if (session.is_blocked) {
      return res.status(403).json({
        error: 'Account has been suspended.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    await db.query('UPDATE sessions SET last_active_at = NOW() WHERE id = $1', [session.id]);

    const { accessToken } = generateTokens(
      { id: session.user_id, role: session.role },
      session.id
    );

    res.status(200).json({ accessToken });
  } catch {
    res.status(401).json({
      error: 'Invalid or expired refresh token.',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      await db.query('UPDATE sessions SET is_revoked = true WHERE id = $1', [decoded.sessionId]);
    } catch {
      // Ignored during logout
    }
  }

  res.status(200).json({ message: 'Logged out successfully.' });
};

const getSessions = async (req, res) => {
  try {
    const currentSessionId = req.user.sessionId || null;
    const result = await db.query(
      `SELECT id, user_agent, ip_address, last_active_at, created_at 
       FROM sessions 
       WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW() 
       ORDER BY last_active_at DESC`,
      [req.user.id]
    );

    const sessions = result.rows.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));

    res.status(200).json(sessions);
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching sessions');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const revokeSession = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query('SELECT user_id FROM sessions WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.', code: 'SESSION_NOT_FOUND' });
    }

    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot revoke another user session.', code: 'FORBIDDEN' });
    }

    await db.query('UPDATE sessions SET is_revoked = true WHERE id = $1', [id]);
    res.status(200).json({ message: 'Session revoked successfully.' });
  } catch (error) {
    logger.error({ error: error.message }, 'Error revoking session');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const revokeOtherSessions = async (req, res) => {
  const currentSessionId = req.body.currentSessionId || null;

  try {
    if (currentSessionId) {
      await db.query(
        'UPDATE sessions SET is_revoked = true WHERE user_id = $1 AND id != $2',
        [req.user.id, currentSessionId]
      );
    } else {
      await db.query(
        'UPDATE sessions SET is_revoked = true WHERE user_id = $1',
        [req.user.id]
      );
    }
    res.status(200).json({ message: 'All other sessions have been revoked.' });
  } catch (error) {
    logger.error({ error: error.message }, 'Error revoking other sessions');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required.',
      code: 'EMAIL_REQUIRED',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const userRes = await db.query('SELECT id, email FROM users WHERE email = $1', [normalizedEmail]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);

      await db.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [user.id, tokenHash]
      );

      try {
        await sendPasswordResetEmail(user.email, rawToken);
      } catch (mailError) {
        logger.error({ email: user.email, error: mailError.message }, 'Failed to dispatch reset email');
      }
    }

    res.status(200).json({
      message: 'If this email is registered, a password reset link has been dispatched.',
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Forgot password error');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      error: 'Token and new password are required.',
      code: 'REQUIRED_FIELDS_MISSING',
    });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(422).json({
      error: 'New password must be at least 6 characters long.',
      code: 'PASSWORD_TOO_SHORT',
    });
  }

  const hashedToken = hashToken(token);

  try {
    const resetRes = await db.query(
      `SELECT id, user_id, expires_at, used 
       FROM password_resets 
       WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
      [hashedToken]
    );

    if (resetRes.rows.length === 0) {
      return res.status(400).json({
        error: 'Reset token is invalid or has expired.',
        code: 'INVALID_RESET_TOKEN',
      });
    }

    const resetRecord = resetRes.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password_hash = $1, failed_login_attempts = 0, lockout_until = NULL, updated_at = NOW() WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    );

    await db.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
    await db.query('UPDATE sessions SET is_revoked = true WHERE user_id = $1', [resetRecord.user_id]);

    res.status(200).json({
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Reset password error');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getSessions,
  revokeSession,
  revokeOtherSessions,
  forgotPassword,
  resetPassword,
  getMe,
};
