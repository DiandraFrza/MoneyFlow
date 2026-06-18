import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/repository';
import type { UserProfile, UserSettings } from '../types';

interface AuthState {
  user: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  isLocal: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email?: string, password?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  settings: null,
  loading: true,
  isLocal: !isSupabaseConfigured,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      if (isSupabaseConfigured) {
        // 1. Check active session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await db.profile.get(session.user.id);
          const settings = await db.settings.get(session.user.id);
          set({ 
            user: profile, 
            settings: settings,
            isLocal: false, 
            loading: false 
          });
          
          // Listen to auth state changes
          supabase.auth.onAuthStateChange(async (_event: any, newSession: any) => {
            if (newSession?.user) {
              const p = await db.profile.get(newSession.user.id);
              const s = await db.settings.get(newSession.user.id);
              set({ user: p, settings: s, isLocal: false });
            } else {
              set({ user: null, settings: null, isLocal: false });
            }
          });
          return;
        }

        // 2. If no Supabase session, check if user chose local guest mode previously
        const useLocal = localStorage.getItem('mf_use_local') === 'true';
        if (useLocal) {
          const localProfile = await db.profile.get('local-user');
          const localSettings = await db.settings.get('local-user');
          set({
            user: localProfile,
            settings: localSettings,
            isLocal: true,
            loading: false
          });
          return;
        }

        // Otherwise, show login screen (user: null)
        set({ user: null, settings: null, isLocal: false, loading: false });
      } else {
        // Fallback: Supabase not configured, enter local mode immediately
        const localProfile = await db.profile.get('local-user');
        const localSettings = await db.settings.get('local-user');
        set({ 
          user: localProfile, 
          settings: localSettings,
          isLocal: true, 
          loading: false 
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // A. Guest Mode (local offline)
      if (!email || !password || !isSupabaseConfigured) {
        localStorage.setItem('mf_use_local', 'true');
        const localProfile = await db.profile.get('local-user');
        const localSettings = await db.settings.get('local-user');
        set({ 
          user: localProfile, 
          settings: localSettings, 
          isLocal: true, 
          loading: false 
        });
        return true;
      }

      // B. Supabase Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        localStorage.setItem('mf_use_local', 'false');
        const profile = await db.profile.get(data.user.id);
        const settings = await db.settings.get(data.user.id);
        set({ 
          user: profile, 
          settings: settings, 
          isLocal: false, 
          loading: false 
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        set({ error: 'Supabase tidak terkonfigurasi. Tidak dapat mendaftar online.' });
        return false;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        // Wait briefly for trigger execution
        await new Promise(r => setTimeout(r, 1200));
        localStorage.setItem('mf_use_local', 'false');
        const profile = await db.profile.get(data.user.id);
        const settings = await db.settings.get(data.user.id);
        set({ 
          user: profile, 
          settings: settings, 
          isLocal: false, 
          loading: false 
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  forgotPassword: async (email) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      } else {
        throw new Error('Supabase tidak terkonfigurasi.');
      }
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      const wasLocal = get().isLocal;
      localStorage.setItem('mf_use_local', 'false');
      
      if (isSupabaseConfigured && !wasLocal) {
        await supabase.auth.signOut();
      }
      
      set({ 
        user: null, 
        settings: null, 
        isLocal: false, 
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    try {
      const updated = await db.profile.update(currentUser.id, updates);
      set({ user: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateSettings: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    try {
      const updated = await db.settings.update(currentUser.id, updates);
      set({ settings: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  }
}));
