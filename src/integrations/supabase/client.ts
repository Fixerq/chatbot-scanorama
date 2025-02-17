
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a custom storage object that handles token persistence
const customStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  clear: () => {
    try {
      // Only clear Supabase-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'supabase.auth.token',
  },
});

// Add a helper to properly clear auth state
export const clearAuthData = async () => {
  try {
    // Clear storage first
    customStorage.clear();
    
    // Then attempt to sign out from Supabase
    // We don't await this since we don't want to block on potential failures
    supabase.auth.signOut().catch(error => {
      console.warn('Error during server-side signout:', error);
      // We don't throw here since we've already cleared local storage
    });
  } catch (error) {
    console.error('Error clearing auth data:', error);
    // Ensure storage is cleared even if there's an error
    customStorage.clear();
  }
};

