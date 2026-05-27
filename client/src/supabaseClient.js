import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase Client] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from client environment.');
}

export const supabase = createClient(supabaseUrl || 'https://ikqoglnaqfhfwdrppxkq.supabase.co', supabaseKey || '');
