
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("⚠️ Supabase URL or Anon Key is missing! The app will not function correctly.");
}

// Export null if keys are missing to prevent crash at module load time.
// Consumers (like AuthContext) will crash when trying to use it, but ErrorBoundary will catch that.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
