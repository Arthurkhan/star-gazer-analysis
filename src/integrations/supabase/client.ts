import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use Service Role key for full database access
const SUPABASE_URL = "https://nmlrvkcvzzeewhamjxgj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbHJ2a2N2enplZXdoYW1qeGdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njk1NzcwNSwiZXhwIjoyMDYyNTMzNzA1fQ.o5rw5EG1PS8chLTZtfqjW1_LkQyXBLJX4MRfoWfoCk4";

// Create and export the Supabase client with service role
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // Don't persist auth state
    autoRefreshToken: false, // Don't try to refresh tokens
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 
      'X-Client-Info': 'star-gazer-analysis'
    },
  },
  // Disable schema metadata functionality to prevent RPC calls to get_table_schema
  schema: {
    enabled: false
  }
});
