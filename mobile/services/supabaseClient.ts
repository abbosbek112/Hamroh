import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SecureStore adapter for Supabase session storage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const createMockClient = () => ({
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
} as any);

let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseInstance = createMockClient();
  console.log('[Supabase] Running in DEMO mode');
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'hamroh_auth_session',
      },
      global: {
        headers: { 'x-application-name': 'hamroh-ai-mobile' },
      },
    });
    console.log('[Supabase] Client initialized for:', supabaseUrl);
  } catch (error) {
    console.error('[Supabase] Initialization error:', error);
    supabaseInstance = createMockClient();
  }
}

export const supabase = supabaseInstance;
