const db = require('../config/db');
const { logger } = require('../config/logger');

const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, is_blocked, created_at, updated_at,
       (SELECT COUNT(*) FROM notes WHERE user_id = users.id) as notes_count,
       (SELECT COUNT(*) FROM sessions WHERE user_id = users.id AND is_revoked = false AND expires_at > NOW()) as active_sessions_count
       FROM users 
       ORDER BY created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch users');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['user', 'moderator', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(422).json({
      error: `Invalid role. Allowed roles are: ${validRoles.join(', ')}`,
      code: 'INVALID_ROLE',
    });
  }

  if (id === req.user.id && role !== 'admin') {
    return res.status(403).json({
      error: 'Administrators cannot demote themselves.',
      code: 'CANNOT_DEMOTE_SELF',
    });
  }

  try {
    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, is_blocked, updated_at',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update user role');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const toggleBlockUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(403).json({
      error: 'Administrators cannot block themselves.',
      code: 'CANNOT_BLOCK_SELF',
    });
  }

  try {
    const userRes = await db.query('SELECT id, is_blocked FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
    }

    const newBlockedState = !userRes.rows[0].is_blocked;

    const result = await db.query(
      'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, is_blocked, updated_at',
      [newBlockedState, id]
    );

    if (newBlockedState) {
      await db.query('UPDATE sessions SET is_revoked = true WHERE user_id = $1', [id]);
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to toggle user block status');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  toggleBlockUser,
};
