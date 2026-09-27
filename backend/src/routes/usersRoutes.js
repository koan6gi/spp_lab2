const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getUsers,
  updateUserRole,
  toggleBlockUser,
} = require('../controllers/usersController');

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/block', toggleBlockUser);

module.exports = router;
