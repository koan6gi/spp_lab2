const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'notes_db',
});

const initDb = async (retries = 10, delay = 2000) => {
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          text TEXT,
          image_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('Database initialized successfully.');
      return;
    } catch (error) {
      retries -= 1;
      console.error(`Database connection failed. Retries left: ${retries}. Error: ${error.message}`);
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
