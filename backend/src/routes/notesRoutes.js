const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/notesController');

router.use(authenticate);

router.get('/', getNotes);
router.post('/', upload.single('image'), createNote);
router.put('/:id', upload.single('image'), updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
