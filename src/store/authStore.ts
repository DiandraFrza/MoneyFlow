/** @format */

import { create } from "zustand";
import { isSupabaseConfigured } from "../lib/supabase";
import { db } from "../lib/repository";
import { generateUuid, isValidUuid } from "../lib/utils";
import type { UserProfile, UserSettings, Workspace, WorkspaceRole, ActiveSession } from "../types";

export interface KeyCheckResult {
  success: boolean;
  needsBinding?: boolean;
  error?: string;
  key?: string;
  name?: string;
  phone?: string;
}

interface AuthState {
  user: UserProfile | null;
  settings: UserSettings | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeRole: WorkspaceRole;
  loading: boolean;
  isLocal: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  accessKey: string | null;
  error: string | null;
  initialize: () => Promise<void>;
  loginWithKey: (key: string) => Promise<KeyCheckResult>;
  activateKey: (key: string, name: string, phone: string) => Promise<boolean>;
  loginDemo: () => Promise<void>;
  // Deprecated compatibility methods
  login: (email?: string, password?: string) => Promise<boolean>;
  register: (email?: string, password?: string, name?: string) => Promise<boolean>;
  forgotPassword: (email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  createWorkspace: (name: string, type: "personal" | "couple" | "family") => Promise<Workspace | null>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  joinWorkspaceByCode: (code: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: WorkspaceRole) => Promise<void>;
  updateWorkspaceName: (workspaceId: string, newName: string) => Promise<void>;
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
  } else {
    // Sinkronkan nama personal workspace jika nama pengguna telah diperbarui
    const personalWs = userWorkspaces.find((w) => w.type === "personal" && w.owner_id === user.id);
    if (personalWs && user.name && user.name.trim()) {
      const expectedName = `${user.name.trim()} Pribadi`;
      if (personalWs.name !== expectedName && (personalWs.name.endsWith(" Pribadi") || personalWs.name.toLowerCase().includes("pribadi"))) {
        personalWs.name = expectedName;
        await db.workspaces.save(personalWs);
      }
    }
  }

  const savedWsId = typeof localStorage !== "undefined" ? localStorage.getItem("mf_active_workspace_id") : null;
  let activeWs = userWorkspaces.find((w) => w.id === savedWsId);
  if (!activeWs || (isSupabaseConfigured && savedWsId && !isValidUuid(savedWsId) && user.id !== "demo-user")) {
    if (typeof localStorage !== "undefined" && savedWsId && !isValidUuid(savedWsId) && user.id !== "demo-user") {
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
      const member = activeWs.members?.find((m) => m.user_id === user.id);
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
  isDemo: false,
  isAdmin: false,
  accessKey: null,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Cek sesi aktif yang tersimpan di localStorage (mf_active_session)
      const rawSession = typeof localStorage !== "undefined" ? localStorage.getItem("mf_active_session") : null;
      if (rawSession) {
        try {
          const session: ActiveSession = JSON.parse(rawSession);

          // Sesi Mode Demo
          if (session.is_demo || session.user_id === "demo-user") {
            console.log("[Auth] Memulihkan sesi Demo Mode...");
            const demoProfile = await db.profile.get("demo-user");
            const demoSettings = await db.settings.get("demo-user");
            const wsData = await resolveUserWorkspaces(demoProfile);
            set({
              user: demoProfile,
              settings: demoSettings,
              ...wsData,
              isLocal: true,
              isDemo: true,
              isAdmin: false,
              accessKey: null,
              loading: false,
            });
            return;
          }

          // Sesi Master Admin
          if (session.is_admin || session.user_id === "admin-user") {
            console.log("[Auth] Memulihkan sesi Master Admin...");
            const adminProfile: UserProfile = {
              id: "admin-user",
              name: session.name || "Master Admin (Lynk.id)",
              currency: "Rp",
              monthly_salary: 0,
              financial_target: 0,
              is_admin: true,
              access_key: session.key || "99999999999",
            };
            const adminSettings = await db.settings.get("admin-user");
            const wsData = await resolveUserWorkspaces(adminProfile);
            set({
              user: adminProfile,
              settings: adminSettings,
              ...wsData,
              isLocal: false,
              isDemo: false,
              isAdmin: true,
              accessKey: session.key || "99999999999",
              loading: false,
            });
            return;
          }

          // Sesi Pengguna Berlisensi 11-Digit
          if (session.key && session.user_id) {
            console.log("[Auth] Memulihkan sesi Lisensi Aktif:", session.key, "user_id:", session.user_id);

            // Cek status keaktifan lisensi di database
            try {
              const keyRecord = await db.accessKeys.getByKey(session.key);
              if (keyRecord && keyRecord.is_active === false) {
                console.warn("[Auth] Lisensi telah dinonaktifkan oleh admin!");
                if (typeof localStorage !== "undefined") {
                  localStorage.removeItem("mf_active_session");
                }
                set({
                  user: null,
                  settings: null,
                  workspaces: [],
                  activeWorkspaceId: null,
                  loading: false,
                  error: "Akun / Kode akses Anda telah dinonaktifkan oleh administrator.",
                });
                return;
              }
            } catch (kErr) {
              console.warn("[Auth] Gagal cek status keaktifan key:", kErr);
            }

            try {
              const profile = await db.profile.get(session.user_id);
              if (session.name && !profile.name) profile.name = session.name;
              profile.access_key = session.key;
              if (session.phone_number) profile.phone_number = session.phone_number;

              const settings = await db.settings.get(session.user_id);
              const wsData = await resolveUserWorkspaces(profile);
              set({
                user: profile,
                settings: settings,
                ...wsData,
                isLocal: !isSupabaseConfigured,
                isDemo: false,
                isAdmin: false,
                accessKey: session.key,
                loading: false,
              });
              return;
            } catch (err: any) {
              console.warn("[Auth] Gagal sinkronisasi data online, menggunakan sesi tersimpan:", err);
              // Fallback jika database offline atau RLS menolak sementara
              const fallbackProfile: UserProfile = {
                id: session.user_id,
                name: session.name || "User",
                currency: "Rp",
                monthly_salary: 0,
                financial_target: 0,
                access_key: session.key,
                phone_number: session.phone_number,
              };
              set({
                user: fallbackProfile,
                loading: false,
              });
              return;
            }
          }
        } catch (e) {
          console.error("[Auth] Gagal membaca mf_active_session:", e);
        }
      }

      // 2. Jika tidak ada sesi aktif, tampilkan form aktivasi kode akses
      console.log("[Auth] Tidak ada sesi tersimpan, menampilkan halaman aktivasi");
      set({
        user: null,
        settings: null,
        workspaces: [],
        activeWorkspaceId: null,
        activeRole: "owner",
        isLocal: false,
        isDemo: false,
        isAdmin: false,
        accessKey: null,
        loading: false,
      });
    } catch (err: any) {
      console.error("[Auth] Error initialize:", err.message);
      set({ error: err.message, loading: false });
    }
  },

  loginWithKey: async (rawKey: string): Promise<KeyCheckResult> => {
    set({ loading: true, error: null });
    const cleanKey = rawKey.replace(/[^0-9]/g, "");

    if (cleanKey.length !== 11) {
      const err = "Kode akses harus terdiri dari tepat 11 digit angka.";
      set({ loading: false, error: err });
      return { success: false, error: err };
    }

    const masterAdminKey = (import.meta.env.VITE_ADMIN_KEY || "99999999999").trim();

    // 1. Cek apakah Master Admin Key
    if (cleanKey === masterAdminKey) {
      console.log("[Auth] ✅ Login sebagai Master Admin");
      const adminUser: UserProfile = {
        id: "admin-user",
        name: "Master Admin (Lynk.id)",
        currency: "Rp",
        monthly_salary: 0,
        financial_target: 0,
        is_admin: true,
        access_key: cleanKey,
      };
      const adminSettings = await db.settings.get("admin-user");
      const wsData = await resolveUserWorkspaces(adminUser);
      const sessionData: ActiveSession = {
        key: cleanKey,
        user_id: "admin-user",
        name: "Master Admin (Lynk.id)",
        is_admin: true,
        activated_at: new Date().toISOString(),
      };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("mf_active_session", JSON.stringify(sessionData));
      }
      set({
        user: adminUser,
        settings: adminSettings,
        ...wsData,
        isLocal: false,
        isDemo: false,
        isAdmin: true,
        accessKey: cleanKey,
        loading: false,
      });
      return { success: true };
    }

    // 2. Cek lisensi di database access_keys
    try {
      let keyRecord = await db.accessKeys.getByKey(cleanKey);

      // Fallback: Jika belum ada di access_keys, cek apakah sudah tertaut di profiles.access_key
      if (!keyRecord) {
        const profileWithKey = await db.profile.getByAccessKey(cleanKey);
        if (profileWithKey) {
          keyRecord = await db.accessKeys.activate(
            cleanKey,
            profileWithKey.name || "User",
            profileWithKey.phone_number || "",
            profileWithKey.id,
          );
        }
      }

      // Jika kode sama sekali tidak ditemukan di database
      if (!keyRecord) {
        const err = "Kode akses tidak terdaftar. Pastikan 11 digit kode yang Anda masukkan benar.";
        set({ loading: false, error: err });
        return { success: false, error: err };
      }

      // Jika akun dinonaktifkan oleh admin
      if (keyRecord.is_active === false) {
        const err = "Akun / Kode akses ini telah dinonaktifkan oleh administrator. Silakan hubungi admin.";
        set({ loading: false, error: err });
        return { success: false, error: err };
      }

      // Pastikan user_id tersedia (jika lisensi baru dibuatkan admin dan belum ada user_id, langsung aktivasi otomatis)
      let userId = keyRecord.user_id;
      if (!userId || !isValidUuid(userId)) {
        userId = generateUuid();
        const userName = keyRecord.user_name?.trim() || "User MoneyFlow";
        const phoneNumber = keyRecord.phone_number?.trim() || "";
        const now = new Date().toISOString();

        // 1. Buat profil di database
        await db.profile.update(userId, {
          id: userId,
          name: userName,
          phone_number: phoneNumber,
          access_key: cleanKey,
          currency: "IDR",
        });

        // 2. Tautkan user_id ke tabel access_keys
        await db.accessKeys.activate(cleanKey, userName, phoneNumber, userId);
        keyRecord.user_id = userId;
        keyRecord.user_name = userName;
        keyRecord.activated_at = now;
      }

      const profile = await db.profile.get(userId);
      profile.name = keyRecord.user_name || profile.name || "User";
      profile.access_key = cleanKey;
      if (keyRecord.phone_number) profile.phone_number = keyRecord.phone_number;

      const settings = await db.settings.get(userId);
      const wsData = await resolveUserWorkspaces(profile);
      const sessionData: ActiveSession = {
        key: cleanKey,
        user_id: userId,
        name: profile.name,
        phone_number: keyRecord.phone_number,
        is_admin: false,
        activated_at: keyRecord.activated_at || new Date().toISOString(),
      };

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("mf_active_session", JSON.stringify(sessionData));
      }

      set({
        user: profile,
        settings: settings,
        ...wsData,
        isLocal: !isSupabaseConfigured,
        isDemo: false,
        isAdmin: false,
        accessKey: cleanKey,
        loading: false,
      });

      return { success: true };
    } catch (err: any) {
      console.error("[Auth] loginWithKey error:", err);
      const msg = err.message || "Gagal memverifikasi kode akses.";
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  activateKey: async (rawKey: string, name: string, phone: string): Promise<boolean> => {
    set({ loading: true, error: null });
    const cleanKey = rawKey.replace(/[^0-9]/g, "");

    if (cleanKey.length !== 11) {
      set({ loading: false, error: "Kode akses harus terdiri dari 11 digit angka." });
      return false;
    }
    if (!name.trim()) {
      set({ loading: false, error: "Nama lengkap wajib diisi untuk mengikat lisensi." });
      return false;
    }
    if (!phone.trim()) {
      set({ loading: false, error: "Nomor WhatsApp wajib diisi untuk verifikasi pembeli." });
      return false;
    }

    try {
      const userId = generateUuid();
      await db.accessKeys.activate(cleanKey, name.trim(), phone.trim(), userId);

      const profile: UserProfile = {
        id: userId,
        name: name.trim(),
        currency: "Rp",
        monthly_salary: 8500000,
        financial_target: 30000000,
        access_key: cleanKey,
        phone_number: phone.trim(),
      };
      await db.profile.update(userId, profile);
      const settings = await db.settings.get(userId);
      const wsData = await resolveUserWorkspaces(profile);

      const sessionData: ActiveSession = {
        key: cleanKey,
        user_id: userId,
        name: name.trim(),
        phone_number: phone.trim(),
        is_admin: false,
        activated_at: new Date().toISOString(),
      };

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("mf_active_session", JSON.stringify(sessionData));
      }

      set({
        user: profile,
        settings: settings,
        ...wsData,
        isLocal: !isSupabaseConfigured,
        isDemo: false,
        isAdmin: false,
        accessKey: cleanKey,
        loading: false,
      });

      return true;
    } catch (err: any) {
      set({ loading: false, error: err.message || "Gagal mengaktifkan kode akses." });
      return false;
    }
  },

  loginDemo: async (): Promise<void> => {
    set({ loading: true, error: null });
    try {
      console.log("[Auth] Mengaktifkan Mode Demo Gratis (20% Fitur)...");
      const demoProfile = await db.profile.get("demo-user");
      const demoSettings = await db.settings.get("demo-user");
      const wsData = await resolveUserWorkspaces(demoProfile);

      const sessionData: ActiveSession = {
        user_id: "demo-user",
        name: "Pengguna Demo",
        is_demo: true,
        activated_at: new Date().toISOString(),
      };

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("mf_active_session", JSON.stringify(sessionData));
      }

      set({
        user: demoProfile,
        settings: demoSettings,
        ...wsData,
        isLocal: true,
        isDemo: true,
        isAdmin: false,
        accessKey: null,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  // Stubs for backward compatibility
  login: async () => {
    return false;
  },
  register: async () => {
    return false;
  },
  forgotPassword: async () => {
    return false;
  },

  logout: async () => {
    set({ loading: true });
    try {
      console.log("[Auth] Logout dan menghapus sesi aktif...");
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("mf_active_session");
        localStorage.removeItem("mf_active_workspace_id");
      }
      set({
        user: null,
        settings: null,
        workspaces: [],
        activeWorkspaceId: null,
        activeRole: "owner",
        isLocal: false,
        isDemo: false,
        isAdmin: false,
        accessKey: null,
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.message,
        loading: false,
        user: null,
        settings: null,
        workspaces: [],
        activeWorkspaceId: null,
        activeRole: "owner",
        isDemo: false,
        isAdmin: false,
      });
    }
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    try {
      console.log("[Auth] Updating profile for user:", currentUser.id, updates);
      const updated = await db.profile.update(currentUser.id, updates);

      // Sinkronkan nama ke localStorage session agar saat refresh tidak kembali ke nama lama
      if (updates.name && typeof localStorage !== "undefined") {
        const rawSession = localStorage.getItem("mf_active_session");
        if (rawSession) {
          try {
            const session = JSON.parse(rawSession);
            session.name = updates.name.trim();
            localStorage.setItem("mf_active_session", JSON.stringify(session));
          } catch (e) {}
        }
      }

      // Jika nama pengguna diubah, sinkronkan juga nama personal workspace
      if (updates.name && updates.name.trim()) {
        const newName = updates.name.trim();
        const currentWorkspaces = get().workspaces;
        const personalWs = currentWorkspaces.find((w) => w.type === "personal" && w.owner_id === currentUser.id);
        if (personalWs) {
          const updatedWs: Workspace = {
            ...personalWs,
            name: `${newName} Pribadi`,
            members: personalWs.members?.map((m) => (m.user_id === currentUser.id ? { ...m, name: newName } : m)) || [],
          };
          await db.workspaces.save(updatedWs);
          set({
            workspaces: currentWorkspaces.map((w) => (w.id === personalWs.id ? updatedWs : w)),
          });
        }
      }

      set({ user: updated });
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

    if (currentUser.id === "demo-user" || get().isDemo) {
      throw new Error("Fitur Kolaborasi Ruang Keuangan terkunci di Mode Demo. Beli Lisensi 11-Digit di Lynk.id untuk membuka.");
    }

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
      const member = ws.members?.find((m) => m.user_id === currentUser.id);
      role = member?.role || "viewer";
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mf_active_workspace_id", workspaceId);
    }

    set({
      activeWorkspaceId: workspaceId,
      activeRole: role,
    });

    try {
      const { useFinanceStore } = await import("./financeStore");
      useFinanceStore.getState().fetchData(currentUser.id, workspaceId);
    } catch (_) {}
  },

  joinWorkspaceByCode: async (code: string) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    if (currentUser.id === "demo-user" || get().isDemo) {
      throw new Error("Fitur Kolaborasi Ruang Keuangan terkunci di Mode Demo. Beli Lisensi 11-Digit di Lynk.id untuk membuka.");
    }

    const cleanCode = code.trim();

    // 1. Try secure RPC join in Supabase first (passing currentUser.id)
    const rpcRes = await db.workspaces.joinByCodeRPC(cleanCode, currentUser.id);
    let targetWsId = rpcRes.workspace_id;
    let targetRole: WorkspaceRole = (rpcRes.role as WorkspaceRole) || "editor";

    // 2. Fallback to direct query & addMember
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

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("mf_workspaces");
      localStorage.setItem("mf_active_workspace_id", targetWsId);
    }

    const userWorkspaces = await db.workspaces.list(currentUser.id);

    set({
      workspaces: userWorkspaces,
      activeWorkspaceId: targetWsId,
      activeRole: targetRole,
    });

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

    const memberIdx = ws.members?.findIndex((m) => m.user_id === targetUserId);
    if (memberIdx === -1 || memberIdx === undefined) return;

    ws.members[memberIdx].role = role;
    await db.workspaces.save(ws);

    const updatedWorkspaces = workspaces.map((w) => (w.id === ws.id ? ws : w));
    set({
      workspaces: updatedWorkspaces,
      ...(targetUserId === currentUser.id ? { activeRole: role } : {}),
    });
  },

  updateWorkspaceName: async (workspaceId: string, newName: string) => {
    const { user: currentUser, workspaces, activeRole } = get();
    if (!currentUser) return;
    if (activeRole !== "owner") {
      throw new Error("Hanya pemilik (owner) yang dapat mengubah nama ruang keuangan.");
    }
    const cleanName = newName.trim();
    if (!cleanName) {
      throw new Error("Nama ruang keuangan tidak boleh kosong.");
    }
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;

    const updatedWs: Workspace = {
      ...ws,
      name: cleanName,
    };
    await db.workspaces.save(updatedWs);

    const updatedWorkspaces = workspaces.map((w) => (w.id === workspaceId ? updatedWs : w));
    set({ workspaces: updatedWorkspaces });
  },
}));
