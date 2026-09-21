require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');
const requestLogger = require('./middleware/logger');
const notesRoutes = require('./routes/notesRoutes');
const { UPLOADS_DIR } = require('./utils/fileHelper');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(requestLogger);

app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/notes', notesRoutes);

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 20 MB limit.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'Payload exceeds the 20 MB limit.' });
  }
  if (err.message === 'Only image files are allowed.') {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled application error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const start = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
