const { Pool } = require('pg');
const initDb = require('./initDb');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Suryansh@4002@db.ikqoglnaqfhfwdrppxkq.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const connectDB = async () => {
  try {
    console.log('[db] Hitting Supabase connection pool...');
    const client = await pool.connect();
    console.log('Supabase PostgreSQL Connected successfully');
    client.release();
    global.useMockDb = false;
    
    // Run database initialization checks
    await initDb(pool);
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    console.log('--- DB SYSTEM FALLBACK ---');
    console.log('Supabase instance is not reachable. Falling back to built-in JSON database (db.json) for testing!');
    console.log('--------------------------');
    global.useMockDb = true;
  }
};

module.exports = connectDB;
module.exports.pool = pool;
