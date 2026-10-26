/** @format */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Plus,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Wallet,
  UserRound,
  CheckCircle2,
  ChevronDown,
  Users,
  Lock,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { useFinanceStore } from "../../store/financeStore";
import { useModalStore } from "../../store/modalStore";
import { QuickAddModal } from "../transactions/QuickAddModal";
import { AdminKeys } from "../../pages/AdminKeys";
import { cn } from "../../lib/utils";
import { useSmartAlerts } from "../../hooks/useSmartAlerts";
import { getJointLink, setJointLink } from "../../lib/repository";
import type { AppNotification } from "../../types";

interface AppLayoutProps {
  children: React.ReactNode;
}

/* ============================================================
   AppLayout - Swiss Style / Minimalism
   Rules:
   • NO border-radius (all corners 90°)
   • NO box-shadow, NO backdrop-blur
   • Hard 1px #1e1e1e borders for all containers
   • Color-inversion on active nav (black bg, white text)
   • Primary accent: #ff5722 for CTAs and active states
   ============================================================ */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout,
    settings,
    workspaces,
    activeWorkspaceId,
    activeRole,
    switchWorkspace,
    isAdmin,
    isDemo,
    loginWithKey,
    activateKey,
  } = useAuthStore();
  const { notifications, readAllNotifications, readNotification } = useFinanceStore();
  const { showToast } = useToastStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { quickAddOpen, quickAddType, openQuickAdd, closeQuickAdd } = useModalStore();

  // Upgrade & License Activation Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState<string | null>(null);
  const [activationKey, setActivationKey] = useState("");
  const [activationName, setActivationName] = useState("");
  const [activationPhone, setActivationPhone] = useState("");
  const [activationStep, setActivationStep] = useState<1 | 2>(1);
  const [activationError, setActivationError] = useState("");
  const [activating, setActivating] = useState(false);

  const [, setIsBalanceHidden] = useState<boolean>(() => {
    return typeof localStorage !== "undefined" ? localStorage.getItem("mf_privacy_mode") === "true" : false;
  });

  useEffect(() => {
    const handlePrivacy = () => {
      setIsBalanceHidden(localStorage.getItem("mf_privacy_mode") === "true");
    };
    window.addEventListener("mf_privacy_change", handlePrivacy);
    window.addEventListener("storage", handlePrivacy);
    return () => {
      window.removeEventListener("mf_privacy_change", handlePrivacy);
      window.removeEventListener("storage", handlePrivacy);
    };
  }, []);

  // Listen to global demo lock requests (e.g. from receipt scanner or export)
  useEffect(() => {
    const handleDemoLock = (e: Event) => {
      const customEvent = e as CustomEvent<{ feature?: string }>;
      setLockedFeatureName(customEvent.detail?.feature || "Fitur Lisensi Penuh");
      setIsUpgradeModalOpen(true);
    };
    window.addEventListener("mf_demo_lock", handleDemoLock);
    return () => {
      window.removeEventListener("mf_demo_lock", handleDemoLock);
    };
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const accountOptions = [
    { id: "local-user", name: "Personal Mode", badge: "Personal" },
    { id: "user-1", name: "Akun 1 (Budi)", badge: "User 1" },
    { id: "user-2", name: "Akun 2 (Siti)", badge: "User 2" },
    { id: "user-joint", name: "Akun Bersama", badge: "Joint" },
  ];

  const currentAccount = accountOptions.find((opt) => opt.id === (user?.id || "local-user")) || accountOptions[0];

  useSmartAlerts();

  const currentPath = location.pathname;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  // Swiss style is light-mode-always - still support dark class toggle
  useEffect(() => {
    if (settings?.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings?.theme]);

  // Navigation Items with Demo locks and Admin License Manager
  const baseNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, locked: false },
    { name: "Transaksi", path: "/transactions", icon: FileText, locked: false },
    { name: "Split Bill", path: "/split-bill", icon: Users, locked: isDemo },
    { name: "Analitik", path: "/reports", icon: BarChart3, locked: isDemo },
    { name: "Dompet", path: "/settings?tab=wallets", icon: Wallet, locked: false },
    { name: "Pengaturan", path: "/settings", icon: Settings, locked: false },
  ];

  const navItems = [
    ...baseNavItems,
    ...(isAdmin || user?.is_admin
      ? [{ name: "Admin Lisensi", path: "/settings?tab=licenses", icon: KeyRound, locked: false }]
      : []),
  ];

  const mobileNavItems = [
    { name: "Beranda", path: "/", icon: LayoutDashboard, locked: false },
    { name: "Transaksi", path: "/transactions", icon: FileText, locked: false },
    { name: "Catat", path: "", icon: Plus, isAction: true, locked: false },
    { name: "Split Bill", path: "/split-bill", icon: Users, locked: isDemo },
    { name: "Pengaturan", path: "/settings", icon: Settings, locked: false },
  ];

  const handleNavClick = (path: string, locked?: boolean) => {
    if (locked && isDemo) {
      if (path === "/reports") setLockedFeatureName("Analisis Laporan Lengkap");
      else if (path === "/split-bill") setLockedFeatureName("Split Bill & Patungan");
      else setLockedFeatureName("Fitur Lisensi Penuh");
    }
    navigate(path);
    setIsSidebarOpen(false);
  };

  const isNavActive = (path: string) => {
    if (path === "/settings?tab=licenses") return currentPath === "/settings" && location.search.includes("tab=licenses");
    if (path === "/settings?tab=wallets") return currentPath === "/settings" && location.search.includes("tab=wallets");
    if (path === "/settings") return currentPath === "/settings" && !location.search.includes("tab=");
    if (path === "/" && (currentPath === "/" || currentPath === "/dashboard")) return true;
    return currentPath === path;
  };

  const handleMarkNotifsRead = () => {
    if (user) readAllNotifications(user.id);
  };

  const handleNotifClick = async (notif: AppNotification) => {
    if (!user) return;
    if (!notif.is_read) await readNotification(user.id, notif.id);
    setIsNotifOpen(false);
    if (notif.type === "budget") navigate("/settings?tab=budgets");
    else if (notif.type === "debt") navigate("/settings?tab=debts");
    else if (notif.type === "bill") navigate("/settings?tab=recurring");
    else navigate("/settings?tab=wallets");
  };

  // Format 11-digit key for modal
  const formatInputKey = (digits: string) => {
    const clean = digits.replace(/[^0-9]/g, "").slice(0, 11);
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) return `${clean.slice(0, 4)} - ${clean.slice(4)}`;
    return `${clean.slice(0, 4)} - ${clean.slice(4, 8)} - ${clean.slice(8)}`;
  };

  const resetActivationForm = () => {
    setActivationKey("");
    setActivationName("");
    setActivationPhone("");
    setActivationStep(1);
    setActivationError("");
  };

  const handleModalKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    const clean = activationKey.replace(/[^0-9]/g, "");

    if (clean.length !== 11) {
      setActivationError("Kode akses harus terdiri dari tepat 11 digit angka.");
      return;
    }

    setActivating(true);
    try {
      const res = await loginWithKey(clean);
      if (res.needsBinding) {
        if (res.name) setActivationName(res.name);
        if (res.phone) setActivationPhone(res.phone);
        setActivationStep(2);
      } else if (res.success) {
        showToast("Selamat! Akses penuh MoneyFlow Pro berhasil diaktifkan.", "success");
        setIsUpgradeModalOpen(false);
        resetActivationForm();
      } else {
        setActivationError(res.error || "Kode akses tidak valid atau tidak terdaftar.");
      }
    } catch (err: any) {
      setActivationError(err.message || "Gagal memverifikasi kode akses.");
    } finally {
      setActivating(false);
    }
  };

  const handleModalBindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");

    if (!activationName.trim()) {
      setActivationError("Silakan masukkan Nama Lengkap Anda.");
      return;
    }

    const cleanPhone = activationPhone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 9) {
      setActivationError("Nomor WhatsApp minimal 9 digit angka.");
      return;
    }

    setActivating(true);
    try {
      const clean = activationKey.replace(/[^0-9]/g, "");
      const success = await activateKey(clean, activationName.trim(), cleanPhone);
      if (success) {
        showToast("Lisensi berhasil diaktivasi dan dihubungkan ke profil Anda!", "success");
        setIsUpgradeModalOpen(false);
        resetActivationForm();
      } else {
        setActivationError(useAuthStore.getState().error || "Gagal mengaktivasi kode akses.");
      }
    } catch (err: any) {
      setActivationError(err.message || "Gagal mengaktivasi kode.");
    } finally {
      setActivating(false);
    }
  };

  /* ------------------------------------------------------------------
     Shared nav link style helper
  ------------------------------------------------------------------ */
  const navLinkClass = (isActive: boolean) =>
    cn(
      "mf-neumo-nav-link flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition-colors",
      isActive && "mf-nav-active"
    );

  const isRouteLocked = isDemo && (currentPath === "/reports" || currentPath === "/split-bill");

  return (
    <div className="mf-app-shell min-h-screen flex flex-col md:flex-row relative">
      {/* =================================================================
          DESKTOP SIDEBAR - Swiss: border-right, flat, square
          ================================================================= */}
      <aside className="mf-sidebar fixed inset-y-0 left-0 z-40 w-64 flex-col justify-between py-6 px-4 hidden md:flex">
        <div className="flex flex-col gap-8">
          {/* Logo - square accent block */}
          <div className="flex items-center gap-3 px-3">
            <div className="h-10 w-10 bg-[#ff5722] flex items-center justify-center text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none text-[#1e1e1e] tracking-tight">MoneyFlow Pro</h1>
              <span className="text-xs text-[#555555] font-medium">
                {isAdmin ? "Admin Console" : isDemo ? "Mode Demo (Beberapa Fitur)" : "Asisten Keuangan Anda"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.path);
              return (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  key={item.name}
                  onClick={() => handleNavClick(item.path, item.locked)}
                  className={navLinkClass(isActive)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.locked && (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#ff5722] text-[#ff5722] bg-[#fff5f2]">
                      <Lock className="h-2.5 w-2.5" /> PRO
                    </span>
                  )}
                </motion.button>
              );
            })}

            {/* Add Transaction - accent solid CTA (hidden if viewer) */}
            {activeRole !== "viewer" ? (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={() => openQuickAdd("expense")}
                className="mf-add-transaction flex items-center gap-3 px-4 py-3 text-sm font-bold mt-4 transition-colors"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                Catat Transaksi
              </motion.button>
            ) : (
              <div className="mt-4 px-3 py-2.5 border border-dashed border-[#1e1e1e] bg-[#f4f4f4] text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">Mode Pengamat (Viewer)</span>
              </div>
            )}
          </nav>
        </div>

        {/* User section at bottom of sidebar */}
        <div className="flex flex-col gap-3 border-t border-[#1e1e1e] pt-4">
          <div
            onClick={() => navigate("/settings")}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#fafafa] border border-transparent hover:border-[#1e1e1e] transition-colors"
          >
            <div className="h-9 w-9 bg-[#1e1e1e] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {isAdmin ? "AD" : user?.name?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none text-[#1e1e1e] tracking-tight">
                {isAdmin ? "Master Admin" : user?.name || "User"}
              </p>
              <span className="text-[10px] text-[#555555] font-bold uppercase tracking-wider truncate block mt-0.5">
                {isAdmin ? "LYNK.ID ADMIN" : isDemo ? "DEMO (20% AKSES)" : `${activeRole.toUpperCase()} · ${activeWorkspace?.name || "Workspace"}`}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#a53a2b] border border-transparent hover:border-[#a53a2b] hover:bg-[#fafafa] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* =================================================================
          MOBILE SIDEBAR OVERLAY - Swiss: flat overlay, smooth slide drawer
          ================================================================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mf-mobile-drawer relative w-64 max-w-xs p-6 flex flex-col justify-between h-full bg-[#fafafa] border-r-2 border-[#1e1e1e]"
            >
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#ff5722] flex items-center justify-center text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm text-[#1e1e1e] tracking-tight">MoneyFlow Pro</span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="h-8 w-8 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavActive(item.path);
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavClick(item.path, item.locked)}
                        className={navLinkClass(isActive)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {item.locked && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#ff5722] text-[#ff5722] bg-[#fff5f2]">
                            <Lock className="h-2.5 w-2.5" /> PRO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-[#1e1e1e] pt-4">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-[#a53a2b] border border-transparent hover:border-[#a53a2b] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================
          MAIN CONTENT AREA (BANNER + HEADER + SCREEN)
          ================================================================= */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-[64px] md:pb-0">
        {/* Sticky Swiss Demo Mode Banner */}
        {isDemo && (
          <div className="bg-[#1e1e1e] text-white px-4 py-2.5 border-b-2 border-[#ff5722] flex flex-wrap items-center justify-between gap-2.5 text-xs z-35 sticky top-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#ff5722] text-white font-black text-[10px] uppercase tracking-widest border border-white/20">
                MODE DEMO
              </span>
              <span className="font-bold text-white text-[11px] sm:text-xs">
                MODE DEMO (Beberapa FITUR) — Beli Kode Akses 11-Digit untuk Buka Semua Fitur
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://lynk.id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold text-[10px] uppercase tracking-wider border border-white/20 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> Beli di Lynk.id
              </a>
              <button
                onClick={() => {
                  setLockedFeatureName(null);
                  setIsUpgradeModalOpen(true);
                }}
                className="px-2.5 py-1 bg-white text-[#1e1e1e] hover:bg-[#f4f4f4] font-bold text-[10px] uppercase tracking-wider border border-[#1e1e1e] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <KeyRound className="h-3 w-3" /> Aktivasi Lisensi
              </button>
            </div>
          </div>
        )}

        {/* ---- HEADER - Swiss: black border-bottom, flat ---- */}
        <header className="mf-global-header h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#f4f4f4] border-b border-[#1e1e1e]">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="h-9 w-9 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] md:hidden hover:bg-[#1e1e1e] hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-base tracking-tight text-[#1e1e1e] hidden sm:block">
              {isAdmin && location.search.includes("tab=licenses")
                ? "Manajemen Lisensi Lynk.id"
                : currentPath === "/"
                ? "Dashboard"
                : currentPath === "/transactions"
                ? "Daftar Transaksi"
                : currentPath === "/reports"
                ? "Analisis Keuangan"
                : currentPath === "/settings"
                ? "Pengaturan"
                : "Aplikasi"}
            </h2>
            {/* Mobile: logo icon */}
            <div className="h-8 w-8 bg-[#ff5722] flex items-center justify-center text-white sm:hidden">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          {/* ---- Header Controls ---- */}
          <div className="flex items-center gap-2">
            {/* Account Switcher - Swiss dropdown with Role Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="mf-account-switcher flex items-center gap-2 px-3 py-1.5 text-xs font-bold cursor-pointer select-none hover:bg-[#f4f4f4] transition-colors border border-[#1e1e1e]"
              >
                <div className="h-5 w-5 bg-[#ff5722] text-white flex items-center justify-center flex-shrink-0">
                  <UserRound className="h-3 w-3" />
                </div>
                <span className="truncate max-w-[85px] sm:max-w-none text-[#1e1e1e]">
                  {isAdmin ? "Admin Console" : isDemo ? "Demo User" : activeWorkspace?.name || currentAccount.name}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-[#1e1e1e]",
                    isAdmin && "bg-[#1e1e1e] text-[#ff5722]",
                    !isAdmin && isDemo && "bg-[#f4f4f4] text-[#a53a2b]",
                    !isAdmin && !isDemo && activeRole === "owner" && "bg-[#1e1e1e] text-white",
                    !isAdmin && !isDemo && activeRole === "editor" && "bg-[#ff5722] text-white",
                    !isAdmin && !isDemo && activeRole === "viewer" && "bg-[#f4f4f4] text-[#1e1e1e]"
                  )}
                >
                  {isAdmin ? "ADMIN" : isDemo ? "DEMO" : activeRole.toUpperCase()}
                </span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 text-[#555555] transition-transform duration-150", isAccountOpen && "rotate-180")}
                />
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)} />
                    {/* Swiss dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-0 w-60 border-2 border-[#1e1e1e] bg-[#fafafa] z-50"
                    >
                      {workspaces.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-[#1e1e1e] bg-[#f4f4f4]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#555555]">
                              Ruang Keuangan (Workspace)
                            </p>
                          </div>
                          {workspaces.map((ws) => {
                            const isSelected = ws.id === activeWorkspaceId;
                            const myRole =
                              ws.owner_id === user?.id
                                ? "owner"
                                : ws.members?.find((m) => m.user_id === user?.id)?.role || "viewer";
                            return (
                              <button
                                key={ws.id}
                                type="button"
                                onClick={async () => {
                                  await switchWorkspace(ws.id);
                                  setIsAccountOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors border-b border-[#e8e8e8]",
                                  isSelected ? "bg-[#1e1e1e] text-white font-bold" : "text-[#1e1e1e] hover:bg-[#f4f4f4]"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={cn("h-2 w-2 flex-shrink-0", isSelected ? "bg-[#ff5722]" : "bg-[#c4c4c4]")} />
                                  <span className="truncate">{ws.name}</span>
                                </div>
                                <span
                                  className={cn(
                                    "text-[8px] font-bold uppercase px-1 border",
                                    isSelected ? "border-white text-white" : "border-[#1e1e1e] text-[#555555]"
                                  )}
                                >
                                  {myRole}
                                </span>
                              </button>
                            );
                          })}
                          <div className="p-2 border-t border-[#1e1e1e] bg-[#ffffff]">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAccountOpen(false);
                                if (isDemo) {
                                  setLockedFeatureName("Kolaborasi Multi-Workspace");
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                navigate("/settings");
                              }}
                              className="w-full py-1.5 px-2 text-[10px] font-black uppercase tracking-wider text-[#ff5722] hover:bg-[#f4f4f4] flex items-center justify-center gap-1.5 border border-dashed border-[#1e1e1e] transition-colors cursor-pointer"
                            >
                              + Kelola / Gabung Ruang
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="h-9 w-9 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-[#a53a2b] text-[10px] font-bold text-white flex items-center justify-center border border-[#f4f4f4]">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-0 w-80 max-w-[90vw] bg-[#fafafa] border-2 border-[#1e1e1e] z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] bg-[#f4f4f4]">
                        <h3 className="font-bold text-sm text-[#1e1e1e] tracking-tight">Notifikasi</h3>
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkNotifsRead}
                            className="text-xs font-bold text-[#ff5722] hover:text-[#1e1e1e] transition-colors uppercase tracking-wider"
                          >
                            Tandai Dibaca
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center text-[#555555] py-8 font-medium">Tidak ada notifikasi baru.</p>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={cn(
                                "p-4 text-xs flex flex-col gap-1.5 cursor-pointer border-b border-[#e8e8e8] last:border-b-0 transition-colors hover:bg-[#f4f4f4]",
                                !notif.is_read && "bg-[#fafafa] font-medium"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={cn(
                                    "font-bold uppercase tracking-wider px-1.5 py-0.5 text-[9px] border",
                                    notif.type === "budget" && "border-[#a53a2b] text-[#a53a2b]",
                                    notif.type === "bill" && "border-[#ff5722] text-[#ff5722]",
                                    notif.type === "debt" && "border-[#9a5a21] text-[#9a5a21]",
                                    notif.type === "system" && "border-[#356342] text-[#356342]"
                                  )}
                                >
                                  {notif.type.toUpperCase()}
                                </span>
                                <span className="text-[9px] text-[#555555]">
                                  {notif.created_at
                                    ? new Date(notif.created_at).toLocaleDateString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs leading-tight text-[#1e1e1e]">{notif.title}</h4>
                              <p className="text-[#555555] leading-normal">{notif.message}</p>
                              {notif.action_type === "joint_invite" && !notif.is_read && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const link = getJointLink();
                                    if (user?.id === "user-1") link.user1Status = "accepted";
                                    if (user?.id === "user-2") link.user2Status = "accepted";
                                    if (link.user1Status === "accepted" && link.user2Status === "accepted")
                                      link.active = true;
                                    setJointLink(link);
                                    await readNotification(user!.id, notif.id);
                                    showToast("Undangan diterima! Akun Bersama siap digunakan.", "success");
                                    if (link.active)
                                      showToast("Kedua akun telah terhubung! Akun Bersama aktif.", "success");
                                  }}
                                  className="mt-2 self-start px-3 py-1.5 border border-[#356342] bg-transparent text-[#356342] font-bold text-[10px] hover:bg-[#356342] hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Terima Undangan
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <div
              onClick={() => navigate("/settings")}
              className="h-9 w-9 bg-[#1e1e1e] hidden sm:flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-[#ff5722] transition-colors select-none border border-[#1e1e1e]"
            >
              {isAdmin ? "AD" : user?.name?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <motion.main
          key={location.pathname + location.search}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mf-page-content flex-1 p-4 md:p-8 overflow-x-hidden"
        >
          {/* Render Admin Lisensi Manager directly when requested */}
          {(isAdmin || user?.is_admin) && (location.search.includes("tab=licenses") || currentPath === "/admin") ? (
            <AdminKeys />
          ) : isRouteLocked ? (
            /* Swiss-style Demo Locked Screen */
            <div className="max-w-2xl mx-auto my-8 border-2 border-[#1e1e1e] bg-white p-6 md:p-8">
              <div className="flex items-center gap-3 border-b-2 border-[#1e1e1e] pb-4 mb-6">
                <div className="h-10 w-10 bg-[#ff5722] text-white flex items-center justify-center border border-[#1e1e1e] flex-shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff5722] block">
                    Fitur Terkunci (Mode Demo)
                  </span>
                  <h2 className="text-xl font-black uppercase tracking-tight text-[#1e1e1e]">
                    {currentPath === "/reports" ? "Analisis & Laporan Keuangan" : "Split Bill & Patungan"}
                  </h2>
                </div>
              </div>

              <div className="p-4 border border-[#1e1e1e] bg-[#fdf2e9] mb-6 space-y-2">
                <p className="text-sm font-bold text-[#1e1e1e]">
                  Mode Demo gratis dibatasi maksimal 1 dompet dan 5 transaksi.
                </p>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Fitur seperti <strong>Analitik Laporan</strong>, <strong>AI Receipt Scanner</strong>,{" "}
                  <strong>Split Bill</strong>, <strong>Export Excel/PDF</strong>, dan{" "}
                  <strong>Multi-Workspace Collaboration</strong> terkunci dan hanya terbuka dengan lisensi seumur hidup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://lynk.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-black text-xs uppercase tracking-wider border border-[#1e1e1e] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Beli Lisensi di Lynk.id
                </a>
                <button
                  onClick={() => {
                    setLockedFeatureName(currentPath === "/reports" ? "Analisis Laporan" : "Split Bill");
                    setIsUpgradeModalOpen(true);
                  }}
                  className="h-11 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-black text-white font-black text-xs uppercase tracking-wider border border-[#1e1e1e] transition-colors cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" /> Masukkan Kode Akses
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </motion.main>
      </div>

      {/* =================================================================
          MOBILE BOTTOM NAVIGATION - Swiss: bordered, flat, square
          ================================================================= */}
      <nav
        aria-label="Navigasi utama"
        className="mf-bottom-nav fixed bottom-0 left-0 right-0 h-16 grid grid-cols-5 items-stretch z-40 md:hidden bg-[#f4f4f4] border-t border-[#1e1e1e]"
      >
        {activeRole !== "viewer" && (
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-50 pointer-events-auto">
            <motion.button
              initial={{ y: 80, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.92 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              type="button"
              onClick={() => openQuickAdd("expense")}
              aria-label="Catat Transaksi"
              className="h-12 w-12 shrink-0 rounded-full bg-[#ff5722] text-white flex items-center justify-center border-2 border-[#1e1e1e] hover:bg-[#e64a19] transition-colors cursor-pointer"
            >
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </motion.button>
          </div>
        )}

        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? isNavActive(item.path) : false;
          const isCenter = item.isAction;

          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.isAction) {
                  openQuickAdd("expense");
                } else {
                  handleNavClick(item.path, item.locked);
                }
              }}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "mf-bottom-link flex flex-col items-center justify-center gap-1 text-[#555555] transition-colors select-none cursor-pointer",
                isCenter && "pt-5 opacity-0 pointer-events-none",
                isActive && "mf-bottom-active font-bold text-[#1e1e1e]"
              )}
            >
              <div className="relative">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.locked && (
                  <Lock className="h-2.5 w-2.5 text-[#ff5722] absolute -top-1 -right-2" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- QUICK ADD MODAL (Global) ---- */}
      <QuickAddModal isOpen={quickAddOpen} onClose={closeQuickAdd} initialType={quickAddType} />

      {/* =================================================================
          SWISS-STYLE UPGRADE & KEY ACTIVATION MODAL
          ================================================================= */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsUpgradeModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white border-2 border-[#1e1e1e] p-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#1e1e1e] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#ff5722] text-white flex items-center justify-center border border-[#1e1e1e]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight text-[#1e1e1e]">
                      Akses Lisensi Penuh MoneyFlow Pro
                    </h3>
                    <p className="text-[10px] text-[#555555] font-semibold">
                      {lockedFeatureName ? `Fitur "${lockedFeatureName}" Terkunci` : "Buka Semua Fitur Tanpa Batasan"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center border border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Feature Comparison / Benefit Box */}
              <div className="p-4 border border-[#1e1e1e] bg-[#fafafa] mb-5 space-y-2 text-xs">
                <p className="font-bold text-[#1e1e1e] uppercase tracking-wider text-[11px]">
                  Keuntungan Lisensi Penuh Lynk.id:
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-[#333333]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>Transaksi & Dompet Tanpa Batas</strong> (Demo terbatas maks 5 transaksi)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>AI Smart Receipt Scanner</strong> (Otomatis scan struk belanja)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>Analisis Keuangan & Laporan Lengkap</strong> (Grafik & Proyeksi Finansial)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>Split Bill & Patungan Pintar</strong> (Bagi tagihan otomatis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>Export Laporan Excel & PDF</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#356342] flex-shrink-0" />
                    <span><strong>Multi-Workspace Collaboration</strong> (Ruang bersama keluarga/bisnis)</span>
                  </div>
                </div>
              </div>

              {/* Lynk.id Purchase Button */}
              <a
                href="https://lynk.id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 mb-5 flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-black text-xs uppercase tracking-wider border border-[#1e1e1e] transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Beli Kode Akses di Lynk.id Sekarang
              </a>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e1e1e]" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-[#555555]">
                  Sudah Memiliki Kode Akses 11-Digit?
                </span>
              </div>

              {/* Activation Form Step 1: Input 11-Digit Key */}
              {activationStep === 1 ? (
                <form onSubmit={handleModalKeySubmit} noValidate className="space-y-4">
                  {activationError && (
                    <div className="p-3 border border-[#a53a2b] bg-[#fff5f5] text-[#a53a2b] text-xs flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1e1e1e] mb-1">
                      Masukkan 11-Digit Kode Akses
                    </label>
                    <input
                      type="text"
                      maxLength={17}
                      value={formatInputKey(activationKey)}
                      onChange={(e) => setActivationKey(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                      placeholder="XXXX - XXXX - XXX"
                      className="w-full h-12 px-3 border-2 border-[#1e1e1e] text-center font-mono text-base font-bold tracking-wider focus:outline-none focus:border-[#ff5722]"
                    />
                    <span className="text-[10px] text-[#555555] block mt-1">
                      {activationKey.length === 11
                        ? "✓ 11 digit lengkap"
                        : `${activationKey.length}/11 digit (Kurang ${11 - activationKey.length} digit lagi)`}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={activating || activationKey.length !== 11}
                    className="w-full h-11 bg-[#1e1e1e] hover:bg-black disabled:bg-[#888888] text-white font-bold text-xs uppercase tracking-wider border border-[#1e1e1e] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <KeyRound className="h-4 w-4" />
                    {activating
                      ? "Memverifikasi..."
                      : activationKey.length === 11
                      ? "Aktivasi Kode Akses"
                      : `Kurang ${11 - activationKey.length} Digit Lagi`}
                  </button>
                </form>
              ) : (
                /* Activation Form Step 2: Bind Profile */
                <form onSubmit={handleModalBindingSubmit} noValidate className="space-y-4">
                  <div className="p-3 border border-[#1e1e1e] bg-[#fdf2e9] text-xs">
                    <p className="font-bold text-[#1e1e1e]">
                      Langkah Terakhir: Hubungkan Lisensi ke Akun Anda
                    </p>
                    <p className="text-[#555555] text-[11px] mt-0.5">
                      Kode <strong>{formatInputKey(activationKey)}</strong> valid. Lengkapi nama dan WhatsApp untuk mencatat aktivasi.
                    </p>
                  </div>

                  {activationError && (
                    <div className="p-3 border border-[#a53a2b] bg-[#fff5f5] text-[#a53a2b] text-xs flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1e1e1e] mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={activationName}
                      onChange={(e) => setActivationName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full h-10 px-3 border border-[#1e1e1e] text-sm focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1e1e1e] mb-1">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={activationPhone}
                      onChange={(e) => setActivationPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full h-10 px-3 border border-[#1e1e1e] text-sm focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActivationStep(1)}
                      className="h-11 px-4 border border-[#1e1e1e] bg-white hover:bg-[#f4f4f4] text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={activating}
                      className="flex-1 h-11 bg-[#ff5722] hover:bg-[#e64a19] disabled:bg-[#888888] text-white font-bold text-xs uppercase tracking-wider border border-[#1e1e1e] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {activating ? "Menyimpan..." : "Aktifkan & Buka Akses Penuh"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;
