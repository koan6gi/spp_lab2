require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { initDb, pool } = require('./config/db');
const { httpLogger, logger } = require('./config/logger');
const swaggerSpec = require('./docs/swagger');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const notesRoutes = require('./routes/notesRoutes');
const { UPLOADS_DIR } = require('./utils/fileHelper');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(httpLogger);

app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notes', notesRoutes);

app.use((err, req, res, _next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 20 MB limit.', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'Payload exceeds the 20 MB limit.', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (err.message === 'Only image files are allowed.') {
    return res.status(400).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
  }

  logger.error({ err, reqId: req.id }, 'Unhandled application error');
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error.',
    code: err.code || 'INTERNAL_SERVER_ERROR',
  });
});

let server;

const shutdown = (signal) => {
  logger.info({ signal }, 'Starting graceful shutdown');

  const forceTimeout = setTimeout(() => {
    logger.error('Shutdown timed out, terminating process');
    process.exit(1);
  }, 4000);

  if (server) {
    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
    server.close(async () => {
      clearTimeout(forceTimeout);
      try {
        await pool.end();
        logger.info('Database pool drained successfully');
      } catch (err) {
        logger.error({ error: err.message }, 'Error closing database pool');
      }
      process.exit(0);
    });
  } else {
    clearTimeout(forceTimeout);
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const start = async () => {
  try {
    await initDb();
    server = app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server listening on port ${PORT}`);
      logger.info(`Swagger UI available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
