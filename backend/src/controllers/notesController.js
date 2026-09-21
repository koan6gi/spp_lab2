const db = require('../config/db');
const { deleteFile } = require('../utils/fileHelper');

const getNotes = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, text, image_url, created_at FROM notes ORDER BY created_at DESC'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const createNote = async (req, res) => {
  const { title, text } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    return res.status(400).json({ error: 'Title is required and cannot be empty.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const noteText = text && text.trim() ? text.trim() : null;

  try {
    const result = await db.query(
      'INSERT INTO notes (title, text, image_url) VALUES ($1, $2, $3) RETURNING id, title, text, image_url, created_at',
      [title.trim(), noteText, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, text, remove_image } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    return res.status(400).json({ error: 'Title is required and cannot be empty.' });
  }

  try {
    const existing = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      if (req.file) {
        await deleteFile(req.file.filename);
      }
      return res.status(404).json({ error: 'Note not found.' });
    }

    const currentNote = existing.rows[0];
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
      'UPDATE notes SET title = $1, text = $2, image_url = $3 WHERE id = $4 RETURNING id, title, text, image_url, created_at',
      [title.trim(), noteText, newImageUrl, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM notes WHERE id = $1 RETURNING image_url', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const imageUrl = result.rows[0].image_url;
    if (imageUrl) {
      await deleteFile(imageUrl);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
