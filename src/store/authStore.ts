/** @format */

import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { db } from "../lib/repository";
import { generateUuid, isValidUuid } from "../lib/utils";
import type { UserProfile, UserSettings, Workspace, WorkspaceRole } from "../types";

interface AuthState {
  user: UserProfile | null;
  settings: UserSettings | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeRole: WorkspaceRole;
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
  switchUser: (userId: string) => Promise<void>;
  createWorkspace: (name: string, type: "personal" | "couple" | "family") => Promise<Workspace | null>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  joinWorkspaceByCode: (code: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: WorkspaceRole) => Promise<void>;
}

const resolveUserWorkspaces = async (user: UserProfile) => {
  let userWorkspaces = await db.workspaces.list(user.id);
  if (!userWorkspaces || userWorkspaces.length === 0) {
    const defaultWs: Workspace = {
      id: generateUuid(),
      name: `${user.name || "Ruang"} Pribadi`,
      type: "personal",
      owner_id: user.id,
      invite_code: `INV-${(user.id || Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`,
      members: [{ user_id: user.id, name: user.name || "User", role: "owner" }],
      created_at: new Date().toISOString(),
    };
    await db.workspaces.save(defaultWs);
    userWorkspaces = [defaultWs];
  }

  const savedWsId = typeof localStorage !== "undefined" ? localStorage.getItem("mf_active_workspace_id") : null;
  // Invalidate stale non-UUID workspace ID in localStorage if connected to Supabase
  let activeWs = userWorkspaces.find((w) => w.id === savedWsId);
  if (!activeWs || (isSupabaseConfigured && savedWsId && !isValidUuid(savedWsId))) {
    if (typeof localStorage !== "undefined" && savedWsId && !isValidUuid(savedWsId)) {
      localStorage.removeItem("mf_active_workspace_id");
    }
    if (user.id === "user-joint") {
      activeWs = userWorkspaces.find((w) => w.id === "ws-joint-couple") || userWorkspaces[0];
    } else {
      activeWs = userWorkspaces[0];
    }
  }

  let activeRole: WorkspaceRole = "viewer";
  if (activeWs) {
    if (activeWs.owner_id === user.id) {
      activeRole = "owner";
    } else {
      const member = activeWs.members.find((m) => m.user_id === user.id);
      activeRole = member?.role || "viewer";
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mf_active_workspace_id", activeWs.id);
    }
  }

  return {
    workspaces: userWorkspaces,
    activeWorkspaceId: activeWs ? activeWs.id : null,
    activeRole,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  settings: null,
  workspaces: [],
  activeWorkspaceId: null,
  activeRole: "owner",
  loading: true,
  isLocal: !isSupabaseConfigured,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      if (isSupabaseConfigured) {
        console.log("[Auth] Supabase terkonfigurasi, mengecek session...");

        // 1. Check active session from Supabase
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();

        if (sessionErr) {
          console.error("[Auth] Error getSession:", sessionErr.message);
        }

        if (session?.user) {
          console.log("[Auth] ✅ Session aktif, user_id:", session.user.id);
          const profile = await db.profile.get(session.user.id);
          const settings = await db.settings.get(session.user.id);
          const wsData = await resolveUserWorkspaces(profile);
          set({
            user: profile,
            settings: settings,
            ...wsData,
            isLocal: false,
            loading: false,
          });
        } else {
          console.log("[Auth] ❌ Tidak ada session aktif, tampilkan halaman login");
          set({ user: null, settings: null, workspaces: [], activeWorkspaceId: null, activeRole: "owner", isLocal: false, loading: false });
        }

        // 2. Listen to auth state changes (for token refresh, etc.)
        supabase.auth.onAuthStateChange(async (event: any, newSession: any) => {
          console.log("[Auth] onAuthStateChange event:", event, "user:", newSession?.user?.id);

          if (event === "SIGNED_OUT") {
            set({ user: null, settings: null, workspaces: [], activeWorkspaceId: null, activeRole: "owner", isLocal: false, loading: false });
            return;
          }

          if (newSession?.user) {
            // Hanya update jika user berubah atau ada SIGNED_IN event
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
              const currentUser = get().user;
              if (!currentUser || currentUser.id !== newSession.user.id || event === "USER_UPDATED") {
                console.log("[Auth] Memperbarui user dari event:", event);
                const p = await db.profile.get(newSession.user.id);
                const s = await db.settings.get(newSession.user.id);
                const wsData = await resolveUserWorkspaces(p);
                set({ user: p, settings: s, ...wsData, isLocal: false, loading: false });
              }
            }
          }
        });
        return;
      }

      // Supabase tidak terkonfigurasi → mode offline
      console.warn("[Auth] ⚠️ Supabase tidak terkonfigurasi, masuk mode offline");
      const localProfile = await db.profile.get("local-user");
      const localSettings = await db.settings.get("local-user");
      const wsData = await resolveUserWorkspaces(localProfile);
      set({
        user: localProfile,
        settings: localSettings,
        ...wsData,
        isLocal: true,
        loading: false,
      });
    } catch (err: any) {
      console.error("[Auth] Error initialize:", err.message);
      set({ error: err.message, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!email && !password) {
        console.warn("[Auth] Login mode lokal/guest dipilih");
        const localProfile = await db.profile.get("local-user");
        const localSettings = await db.settings.get("local-user");
        const wsData = await resolveUserWorkspaces(localProfile);
        set({ user: localProfile, settings: localSettings, ...wsData, isLocal: true, loading: false });
        return true;
      }

      if (!isSupabaseConfigured) {
        console.warn("[Auth] Login offline (Supabase tidak terkonfigurasi)");
        const localProfile = await db.profile.get("local-user");
        const localSettings = await db.settings.get("local-user");
        const wsData = await resolveUserWorkspaces(localProfile);
        set({
          user: localProfile,
          settings: localSettings,
          ...wsData,
          isLocal: true,
          loading: false,
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
        const wsData = await resolveUserWorkspaces(profile);
        set({
          user: profile,
          settings: settings,
          ...wsData,
          isLocal: false,
          loading: false,
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
        set({ error: "Supabase tidak terkonfigurasi. Tidak dapat mendaftar online.", loading: false });
        return false;
      }

      console.log("[Auth] Registrasi Supabase, email:", email, "name:", name);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error("[Auth] Registrasi error:", error.message);
        throw error;
      }

      if (data.user) {
        console.log("[Auth] ✅ Registrasi berhasil, user_id:", data.user.id);
        // Tunggu sebentar agar trigger Supabase berjalan (jika ada)
        await new Promise((r) => setTimeout(r, 1500));
        const profile = await db.profile.get(data.user.id);
        const settings = await db.settings.get(data.user.id);
        const wsData = await resolveUserWorkspaces(profile);
        set({
          user: profile,
          settings: settings,
          ...wsData,
          isLocal: false,
          loading: false,
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
        throw new Error("Supabase tidak terkonfigurasi.");
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

      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("mf_active_workspace_id");
      }

      set({
        user: null,
        settings: null,
        workspaces: [],
        activeWorkspaceId: null,
        activeRole: "owner",
        isLocal: false,
        loading: false,
      });
    } catch (err: any) {
      console.error("[Auth] Logout error:", err.message);
      set({ error: err.message, loading: false, user: null, settings: null, workspaces: [], activeWorkspaceId: null, activeRole: "owner" });
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
    if (!get().user) return;
    try {
      const updated = await db.settings.update(get().user!.id, updates);
      set({ settings: updated });
    } catch (err: any) {
      console.error("[Auth] Error updateSettings:", err.message);
    }
  },

  switchUser: async (userId: string) => {
    set({ loading: true });
    try {
      const profile = await db.profile.get(userId);
      const settings = await db.settings.get(userId);
      const wsData = await resolveUserWorkspaces(profile);
      set({ user: profile, settings: settings, ...wsData, loading: false });
    } catch (err: any) {
      console.error("[Auth] Error switchUser:", err.message);
      set({ error: err.message, loading: false });
    }
  },

  createWorkspace: async (name: string, type: "personal" | "couple" | "family") => {
    const currentUser = get().user;
    if (!currentUser) return null;

    const newWs: Workspace = {
      id: generateUuid(),
      name: name.trim(),
      type,
      owner_id: currentUser.id,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      members: [
        {
          user_id: currentUser.id,
          name: currentUser.name || "User",
          role: "owner",
        },
      ],
      created_at: new Date().toISOString(),
    };

    await db.workspaces.save(newWs);
    const updatedWorkspaces = [...get().workspaces, newWs];

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mf_active_workspace_id", newWs.id);
    }

    set({
      workspaces: updatedWorkspaces,
      activeWorkspaceId: newWs.id,
      activeRole: "owner",
    });

    return newWs;
  },

  switchWorkspace: async (workspaceId: string) => {
    const currentUser = get().user;
    const ws = get().workspaces.find((w) => w.id === workspaceId);
    if (!ws || !currentUser) return;

    let role: WorkspaceRole = "viewer";
    if (ws.owner_id === currentUser.id) {
      role = "owner";
    } else {
      const member = ws.members.find((m) => m.user_id === currentUser.id);
      role = member?.role || "viewer";
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mf_active_workspace_id", workspaceId);
    }

    set({
      activeWorkspaceId: workspaceId,
      activeRole: role,
    });

    // Re-fetch finance data for the new workspace
    try {
      const { useFinanceStore } = await import("./financeStore");
      useFinanceStore.getState().fetchData(currentUser.id, workspaceId);
    } catch (_) {}
  },

  joinWorkspaceByCode: async (code: string) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const cleanCode = code.trim();

    // 1. Try secure RPC join in Supabase first
    const rpcRes = await db.workspaces.joinByCodeRPC(cleanCode);
    let targetWsId = rpcRes.workspace_id;
    let targetRole: WorkspaceRole = (rpcRes.role as WorkspaceRole) || "editor";

    // 2. If RPC was not used / returned false, fallback to direct query & addMember
    if (!rpcRes.success || !targetWsId) {
      const ws = await db.workspaces.getByCode(cleanCode);
      if (!ws) return false;

      targetWsId = ws.id;
      const isOwner = ws.owner_id === currentUser.id;
      targetRole = isOwner ? "owner" : "editor";

      if (!isOwner) {
        await db.workspaces.addMember(ws.id, currentUser.id, "editor", currentUser.name || "User");
      }
    }

    // Force-invalidate localStorage cache
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("mf_workspaces");
      localStorage.setItem("mf_active_workspace_id", targetWsId);
    }

    // Fetch fresh workspaces from DB
    const userWorkspaces = await db.workspaces.list(currentUser.id);

    set({
      workspaces: userWorkspaces,
      activeWorkspaceId: targetWsId,
      activeRole: targetRole,
    });

    // Re-fetch finance data immediately for the joined workspace
    try {
      const { useFinanceStore } = await import("./financeStore");
      await useFinanceStore.getState().fetchData(currentUser.id, targetWsId);
    } catch (_) {}

    return true;
  },

  updateMemberRole: async (targetUserId: string, role: WorkspaceRole) => {
    const { user: currentUser, activeWorkspaceId, workspaces, activeRole } = get();
    if (!currentUser || !activeWorkspaceId) return;

    if (activeRole !== "owner") {
      throw new Error("Hanya pemilik (owner) yang dapat mengubah peran anggota.");
    }

    const ws = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!ws) return;

    const memberIdx = ws.members.findIndex((m) => m.user_id === targetUserId);
    if (memberIdx === -1) return;

    ws.members[memberIdx].role = role;
    await db.workspaces.save(ws);

    const updatedWorkspaces = workspaces.map((w) => (w.id === ws.id ? ws : w));
    set({
      workspaces: updatedWorkspaces,
      ...(targetUserId === currentUser.id ? { activeRole: role } : {}),
    });
  },
}));
