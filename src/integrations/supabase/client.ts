import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are loaded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Log environment status (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET',
    env: import.meta.env.MODE,
  })
}

// Initialize the Supabase client
let supabase: ReturnType<typeof createClient>

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ⚠️ Supabase credentials are missing!
    
    Please create a .env.local file in your project root with:
    
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    You can find these in your Supabase project dashboard:
    Settings → API → Project URL & anon key
    
    After creating the file, restart your development server.
  `

  console.error(errorMessage)

  // In development, show a more prominent error
  if (import.meta.env.DEV) {
    // Create a visible error message on the page
    setTimeout(() => {
      const existingError = document.getElementById('supabase-error')
      if (!existingError) {
        const errorDiv = document.createElement('div')
        errorDiv.id = 'supabase-error'
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
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `
        errorDiv.textContent = errorMessage
        document.body.appendChild(errorDiv)
      }
    }, 1000)
  }

  // Create a dummy client to prevent crashes but the app won't work
  // Using dummy values that will fail gracefully
  const dummyUrl = 'https://dummy.supabase.co'
  const dummyKey = 'dummy.key.value'

  console.warn('Creating dummy Supabase client - app will not function properly')

  supabase = createClient(dummyUrl, dummyKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
} else {
  // Create the actual Supabase client with proper configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: {
        getItem: (key) => {
          try {
            return window.localStorage.getItem(key)
          } catch (error) {
            console.warn('localStorage.getItem failed:', error)
            return null
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(key, value)
          } catch (error) {
            console.warn('localStorage.setItem failed:', error)
          }
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(key)
          } catch (error) {
            console.warn('localStorage.removeItem failed:', error)
          }
        },
      },
    },
    // Add request options to handle CORS
    global: {
      headers: {
        'x-client-info': 'star-gazer-analysis',
      },
    },
  })

  // Verify connection in development
  if (import.meta.env.DEV) {
    supabase.from('reviews')
      .select('count', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error('❌ Supabase connection test failed:', error.message)
        } else {
          console.log('✅ Supabase connected successfully')
        }
      })
  }
}

// Export the client
export { supabase }
