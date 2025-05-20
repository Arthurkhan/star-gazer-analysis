import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use Service Role key for full database access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nmlrvkcvzzeewhamjxgj.supabase.co";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbHJ2a2N2enplZXdoYW1qeGdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njk1NzcwNSwiZXhwIjoyMDYyNTMzNzA1fQ.o5rw5EG1PS8chLTZtfqjW1_LkQyXBLJX4MRfoWfoCk4";

console.log('Initializing Supabase client with URL:', SUPABASE_URL);

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
  }
});

// Test the connection without using count() which can be problematic
(async () => {
  try {
    // Just try to fetch a single row to verify connection
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
    } else {
      console.log('Successfully connected to Supabase database.');
    }
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
  }
})();
