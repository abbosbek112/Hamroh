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
import { logger } from '../utils/logger';

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
        data: { subscription: { unsubscribe: () => { } } },
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
      on: () => ({ subscribe: () => { } }),
      subscribe: () => { },
    }),
  } as any;
};

// Initialize Supabase client or use mock if env vars are missing
let supabaseInstance: any;

// SECURITY: Sanitize URLs to prevent double-slashes or trailing slash issues
const sanitizeUrl = (url: string) => {
  if (!url) return '';
  let sanitized = url.trim();
  // Remove trailing slashes
  sanitized = sanitized.replace(/\/+$/, '');
  return sanitized;
};

const finalUrl = sanitizeUrl(supabaseUrl || '');

if (!finalUrl || !supabaseAnonKey || isAuthDisabled) {
  // Use mock client in demo mode
  supabaseInstance = createMockClient();

  // Log status
  logger.log('[Supabase] Initializing in DEMO mode (Auth Disabled or missing keys)');
} else {
  // Initialize real Supabase client
  try {
    supabaseInstance = createClient(finalUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // FORCE localStorage to avoid cookie domain issues on Netlify subdomains
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'hamroh_auth_session',
        // PKCE is default, but we can fallback to implicit if domain issues occur
        flowType: typeof window !== 'undefined' && window.crypto && window.crypto.subtle ? 'pkce' : 'implicit',
      },
      global: {
        headers: { 'x-application-name': 'hamroh-ai' },
      },
      db: {
        schema: 'public'
      }
    });

    logger.log('[Supabase] Client initialized for:', finalUrl);
  } catch (error) {
    logger.error('[Supabase] Critical initialization error:', error);
    supabaseInstance = createMockClient();
  }

  // Handle auth state changes globally (single listener to avoid duplicate subscriptions)
  if (typeof window !== 'undefined' && supabaseInstance.auth) {
    supabaseInstance.auth.onAuthStateChange((event: string, _session: any) => {
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        try {
          localStorage.removeItem('hamroh_auth_session');
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    });
  }
}

// Export the Supabase client instance
export const supabase = supabaseInstance;
