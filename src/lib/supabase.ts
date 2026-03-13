import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ampnnkqdnjggkcarqunl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcG5ua3FkbmpnZ2tjYXJxdW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODc1MzcsImV4cCI6MjA4ODk2MzUzN30.2ei-18n7kwEuuu8B5928Y40dbgN6OUi-BZLfCgl5uAU';

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== '' && !supabaseUrl.includes('placeholder') && 
         supabaseAnonKey !== '' && !supabaseAnonKey.includes('placeholder'));
};
