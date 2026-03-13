import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if config is present to avoid console errors on load
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== '' && !supabaseUrl.includes('placeholder') && 
         supabaseAnonKey !== '' && !supabaseAnonKey.includes('placeholder'));
};
