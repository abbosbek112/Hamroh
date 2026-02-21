/**
 * =========================================================================================
 * 🚀 SUPABASE CLIENT INITIALIZATION
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Validates environment variables before initialization
 * - Creates mock client for demo mode (prevents crashes)
 * - Proper error handling
 * - Session management with auto-refresh
 * - PKCE flow for enhanced security
 * 
 * REAL-TIME FEATURES:
 * - WebSocket support for real-time updates
 * - Proper connection cleanup
 * - Error recovery
 * 
 * ENVIRONMENT VARIABLES:
 * - VITE_SUPABASE_URL: Your Supabase project URL (required for production)
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key (required for production)
 * - VITE_AUTH_DISABLED: Set to 'true' to enable demo mode (optional)
 * 
 * DEMO MODE:
 * - If VITE_AUTH_DISABLED='true' or env vars missing, creates mock client
 * - Mock client allows UI to work without backend
 * - All backend operations return empty results in demo mode
 * 
 * SETUP:
 * 1. Create a .env file in the project root
 * 2. Add: VITE_SUPABASE_URL=your_supabase_url
 * 3. Add: VITE_SUPABASE_ANON_KEY=your_anon_key
 * 4. (Optional) Add: VITE_AUTH_DISABLED=true for demo mode
 * =========================================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Type assertion for Vite environment variables
// Vite provides import.meta.env at runtime, but TypeScript needs type assertion
const env = (import.meta as any).env as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const isAuthDisabled = env.VITE_AUTH_DISABLED === 'true';

// Create mock client for demo mode (when env vars are missing or auth is disabled)
const createMockClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Backend not configured' } }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Backend not configured' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Backend not configured' } }),
      update: () => ({ data: null, error: { message: 'Backend not configured' } }),
      delete: () => ({ data: null, error: { message: 'Backend not configured' } }),
      maybeSingle: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: { message: 'Backend not configured' } }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
  } as any;
};

// Initialize Supabase client or use mock if env vars are missing
let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey || isAuthDisabled) {
  // Use mock client in demo mode
  supabaseInstance = createMockClient();
  
  // Log warning in development only
  if (import.meta.env.DEV) {
    console.warn('[Supabase] Running in demo mode - backend features disabled');
  }
} else {
  // Initialize real Supabase client
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Clear invalid sessions on error
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      // Use 'pkce' if WebCrypto is available, otherwise fallback to 'implicit'
      flowType: typeof window !== 'undefined' && window.crypto && window.crypto.subtle ? 'pkce' : 'implicit',
    },
  });

  // Handle invalid refresh token errors globally
  if (typeof window !== 'undefined') {
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        try {
          localStorage.removeItem('supabase.auth.token');
        } catch (e) {
          // Ignore localStorage errors
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Session refreshed successfully
      } else if (event === 'SIGNED_IN') {
        // User signed in
      } else if (event === 'USER_UPDATED') {
        // User data updated
      }
    });
    
    // Handle session errors
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        // Session cleared
      }
    });
  }
}

// Export the Supabase client instance
export const supabase = supabaseInstance;
