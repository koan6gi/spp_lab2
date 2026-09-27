const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { logger } = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'notes_db',
});

const seedDefaultUsers = async () => {
  const countRes = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    const defaultPassword = 'Password123!';
    const hash = await bcrypt.hash(defaultPassword, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES 
       ('admin@example.com', $1, 'admin'),
       ('moderator@example.com', $1, 'moderator'),
       ('user@example.com', $1, 'user')`,
      [hash]
    );
    logger.info('Default seed users created (admin@example.com, moderator@example.com, user@example.com / Password123!)');
  }
};

const initDb = async (retries = 10, delay = 2000) => {
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL DEFAULT 'user',
          is_blocked BOOLEAN NOT NULL DEFAULT false,
          failed_login_attempts INT NOT NULL DEFAULT 0,
          lockout_until TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          refresh_token_hash VARCHAR(255) NOT NULL,
          user_agent VARCHAR(500),
          ip_address VARCHAR(45),
          last_active_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          is_revoked BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS password_resets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          text TEXT,
          image_url VARCHAR(500),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'user';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);
      `);

      await seedDefaultUsers();

      logger.info('Database initialized and verified successfully');
      return;
    } catch (error) {
      retries -= 1;
      logger.error({ error: error.message, retriesLeft: retries }, 'Database connection failed during init');
      if (retries === 0) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb,
};
