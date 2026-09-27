const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', authenticate, getMe);
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions', authenticate, revokeOtherSessions);
router.delete('/sessions/:id', authenticate, revokeSession);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
