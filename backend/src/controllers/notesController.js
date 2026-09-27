const db = require('../config/db');
const { deleteFile } = require('../utils/fileHelper');
const { logger } = require('../config/logger');

const getNotes = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      query = `
        SELECT n.id, n.title, n.text, n.image_url, n.created_at, n.user_id, u.email as author_email 
        FROM notes n 
        LEFT JOIN users u ON n.user_id = u.id 
        ORDER BY n.created_at DESC
      `;
    } else {
      query = `
        SELECT id, title, text, image_url, created_at, user_id 
        FROM notes 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await db.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching notes');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const createNote = async (req, res) => {
  const { title, text } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    return res.status(400).json({ error: 'Title is required and cannot be empty.', code: 'TITLE_REQUIRED' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const noteText = text && text.trim() ? text.trim() : null;

  try {
    const result = await db.query(
      `INSERT INTO notes (title, text, image_url, user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, title, text, image_url, user_id, created_at`,
      [title.trim(), noteText, imageUrl, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    logger.error({ error: error.message }, 'Error creating note');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, text, remove_image } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    return res.status(400).json({ error: 'Title is required and cannot be empty.', code: 'TITLE_REQUIRED' });
  }

  try {
    const existing = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      if (req.file) {
        await deleteFile(req.file.filename);
      }
      return res.status(404).json({ error: 'Note not found.', code: 'NOTE_NOT_FOUND' });
    }

    const currentNote = existing.rows[0];

    const canEdit = req.user.role === 'admin' || req.user.role === 'moderator' || currentNote.user_id === req.user.id;
    if (!canEdit) {
      if (req.file) {
        await deleteFile(req.file.filename);
      }
      return res.status(403).json({ error: 'You do not have permission to modify this note.', code: 'FORBIDDEN_NOTE_ACCESS' });
    }

    let newImageUrl = currentNote.image_url;

    if (req.file) {
      await deleteFile(currentNote.image_url);
      newImageUrl = `/uploads/${req.file.filename}`;
    } else if (remove_image === true || remove_image === 'true') {
      await deleteFile(currentNote.image_url);
      newImageUrl = null;
    }

    const noteText = text && text.trim() ? text.trim() : null;

    const result = await db.query(
      `UPDATE notes 
       SET title = $1, text = $2, image_url = $3 
       WHERE id = $4 
       RETURNING id, title, text, image_url, user_id, created_at`,
      [title.trim(), noteText, newImageUrl, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    logger.error({ error: error.message }, 'Error updating note');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.', code: 'NOTE_NOT_FOUND' });
    }

    const currentNote = existing.rows[0];
    const canDelete = req.user.role === 'admin' || req.user.role === 'moderator' || currentNote.user_id === req.user.id;
    if (!canDelete) {
      return res.status(403).json({ error: 'You do not have permission to delete this note.', code: 'FORBIDDEN_NOTE_ACCESS' });
    }

    await db.query('DELETE FROM notes WHERE id = $1', [id]);

    if (currentNote.image_url) {
      await deleteFile(currentNote.image_url);
    }

    res.status(204).send();
  } catch (error) {
    logger.error({ error: error.message }, 'Error deleting note');
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
