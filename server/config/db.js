const { Pool } = require('pg');
const initDb = require('./initDb');

// Default to mock database until connection confirms success
global.useMockDb = true;
let activePool = null;

const poolerUrl = 'postgresql://postgres.ikqoglnaqfhfwdrppxkq:Suryansh@4002@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const directUrl = 'postgresql://postgres:Suryansh@4002@db.ikqoglnaqfhfwdrppxkq.supabase.co:5432/postgres';

const connectDB = async () => {
  const connectionString = process.env.DATABASE_URL;
  
  // 1. If custom DATABASE_URL is explicitly set, try it first
  if (connectionString) {
    try {
      console.log('[db] Connecting to custom DATABASE_URL...');
      const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
      const client = await pool.connect();
      console.log('PostgreSQL Connected successfully via custom DATABASE_URL');
      client.release();
      activePool = pool;
      global.useMockDb = false;
      await initDb(pool);
      return;
    } catch (error) {
      console.error(`Custom DATABASE_URL Connection Error: ${error.message}`);
    }
  }

  // 2. Try Connection Pooler (IPv4 compatible)
  try {
    console.log('[db] Hitting Supabase connection pool (IPv4)...');
    const pool = new Pool({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    console.log('Supabase PostgreSQL Connected successfully via Connection Pooler');
    client.release();
    activePool = pool;
    global.useMockDb = false;
    await initDb(pool);
    return;
  } catch (error) {
    console.warn(`Supabase Pooler Connection Failed: ${error.message}`);
  }

  // 3. Try Direct connection (IPv6 only)
  try {
    console.log('[db] Trying Supabase Direct Connection (IPv6)...');
    const pool = new Pool({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    console.log('Supabase PostgreSQL Connected successfully via Direct Connection');
    client.release();
    activePool = pool;
    global.useMockDb = false;
    await initDb(pool);
    return;
  } catch (error) {
    console.error(`Supabase Direct Connection Failed: ${error.message}`);
  }

  console.log('--- DB SYSTEM FALLBACK ---');
  console.log('Supabase instance is not reachable on any route. Falling back to built-in JSON database (db.json) for testing!');
  console.log('--------------------------');
  global.useMockDb = true;
};

module.exports = connectDB;
Object.defineProperty(module.exports, 'pool', {
  get: () => {
    return activePool;
  }
});

