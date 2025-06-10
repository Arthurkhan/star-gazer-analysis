import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ⚠️ Supabase credentials are missing!
    
    Please create a .env.local file in your project root with:
    
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    You can find these in your Supabase project dashboard:
    Settings → API → Project URL & anon key
  `;
  
  console.error(errorMessage);
  
  // In development, show a more prominent error
  if (import.meta.env.DEV) {
    // Create a visible error message on the page
    setTimeout(() => {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff4444;
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: monospace;
        white-space: pre-wrap;
        z-index: 9999;
        max-width: 600px;
      `;
      errorDiv.textContent = errorMessage;
      document.body.appendChild(errorDiv);
    }, 1000);
  }
  
  // Provide dummy values to prevent crash, but the app won't work properly
  throw new Error('Supabase credentials are required. Check console for setup instructions.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storage: {
      getItem: (key) => {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // Ignore localStorage errors in iframe
        }
      },
      removeItem: (key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore localStorage errors in iframe
        }
      },
    },
  },
});
