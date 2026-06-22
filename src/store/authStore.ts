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
  login: (email: string, password: string) => Promise<boolean>;
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
        console.log("[Auth] Supabase terkonfigurasi, mengecek session...");

        // 1. Check active session from Supabase
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        
        if (sessionErr) {
          console.error("[Auth] Error getSession:", sessionErr.message);
        }

        if (session?.user) {
          console.log("[Auth] ✅ Session aktif, user_id:", session.user.id);
          const profile = await db.profile.get(session.user.id);
          const settings = await db.settings.get(session.user.id);
          set({ 
            user: profile, 
            settings: settings,
            isLocal: false, 
            loading: false 
          });
        } else {
          console.log("[Auth] ❌ Tidak ada session aktif, tampilkan halaman login");
          set({ user: null, settings: null, isLocal: false, loading: false });
        }

        // 2. Listen to auth state changes (for token refresh, etc.)
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("[Auth] onAuthStateChange event:", event, "user:", newSession?.user?.id);

          if (event === 'SIGNED_OUT') {
            set({ user: null, settings: null, isLocal: false, loading: false });
            return;
          }

          if (newSession?.user) {
            // Hanya update jika user berubah atau ada SIGNED_IN event
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              const currentUser = get().user;
              if (!currentUser || currentUser.id !== newSession.user.id || event === 'USER_UPDATED') {
                console.log("[Auth] Memperbarui user dari event:", event);
                const p = await db.profile.get(newSession.user.id);
                const s = await db.settings.get(newSession.user.id);
                set({ user: p, settings: s, isLocal: false, loading: false });
              }
            }
          }
        });
        return;
      }

      // Supabase tidak terkonfigurasi → mode offline
      console.warn("[Auth] ⚠️ Supabase tidak terkonfigurasi, masuk mode offline");
      const localProfile = await db.profile.get('local-user');
      const localSettings = await db.settings.get('local-user');
      set({ 
        user: localProfile, 
        settings: localSettings,
        isLocal: true, 
        loading: false 
      });
    } catch (err: any) {
      console.error("[Auth] Error initialize:", err.message);
      set({ error: err.message, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        console.warn("[Auth] Login offline (Supabase tidak terkonfigurasi)");
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

      console.log("[Auth] Login Supabase, email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("[Auth] Login error:", error.message);
        throw error;
      }

      if (data.user) {
        console.log("[Auth] ✅ Login berhasil, user_id:", data.user.id);
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
      console.error("[Auth] Login gagal:", err.message);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        set({ error: 'Supabase tidak terkonfigurasi. Tidak dapat mendaftar online.', loading: false });
        return false;
      }

      console.log("[Auth] Registrasi Supabase, email:", email, "name:", name);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        console.error("[Auth] Registrasi error:", error.message);
        throw error;
      }
      
      if (data.user) {
        console.log("[Auth] ✅ Registrasi berhasil, user_id:", data.user.id);
        // Tunggu sebentar agar trigger Supabase berjalan (jika ada)
        await new Promise(r => setTimeout(r, 1500));
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
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error("[Auth] Registrasi gagal:", err.message);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  forgotPassword: async (email) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase tidak terkonfigurasi.');
      }
      console.log("[Auth] Reset password untuk:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("[Auth] Reset password error:", err.message);
      set({ error: err.message });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      console.log("[Auth] Logout...");
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
        console.log("[Auth] ✅ Logout Supabase berhasil");
      }
      
      set({ 
        user: null, 
        settings: null, 
        isLocal: false, 
        loading: false 
      });
    } catch (err: any) {
      console.error("[Auth] Logout error:", err.message);
      set({ error: err.message, loading: false, user: null, settings: null });
    }
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    try {
      console.log("[Auth] Update profile, user_id:", currentUser.id, "updates:", updates);
      const updated = await db.profile.update(currentUser.id, updates);
      set({ user: updated });
      console.log("[Auth] ✅ Profile berhasil diperbarui");
    } catch (err: any) {
      console.error("[Auth] Update profile error:", err.message);
      set({ error: err.message });
    }
  },

  updateSettings: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    try {
      console.log("[Auth] Update settings, user_id:", currentUser.id, "updates:", updates);
      const updated = await db.settings.update(currentUser.id, updates);
      set({ settings: updated });
    } catch (err: any) {
      console.error("[Auth] Update settings error:", err.message);
      set({ error: err.message });
    }
  }
}));
