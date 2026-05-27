const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ikqoglnaqfhfwdrppxkq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase Server] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing from server environment.');
}

const supabase = createClient(supabaseUrl, supabaseKey || '', {
  auth: {
    persistSession: false
  }
});

console.log('[Supabase Server] Supabase client initialized.');

module.exports = supabase;
