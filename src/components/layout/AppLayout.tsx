/** @format */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Plus, BarChart3, Settings, Bell, LogOut, Menu, X, Wallet, UserRound, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { useFinanceStore } from "../../store/financeStore";
import { useModalStore } from "../../store/modalStore";
import { QuickAddModal } from "../transactions/QuickAddModal";
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
  const { user, logout, switchUser, settings, workspaces, activeWorkspaceId, activeRole, switchWorkspace } = useAuthStore();
  const { notifications, readAllNotifications, readNotification } = useFinanceStore();
  const { showToast } = useToastStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { quickAddOpen, quickAddType, openQuickAdd, closeQuickAdd } = useModalStore();

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

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Transaksi", path: "/transactions", icon: FileText },
    { name: "Analitik", path: "/reports", icon: BarChart3 },
    { name: "Dompet", path: "/settings?tab=wallets", icon: Wallet },
    { name: "Pengaturan", path: "/settings", icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const isNavActive = (path: string) => {
    if (path === "/settings?tab=wallets") return currentPath === "/settings" && location.search.includes("tab=wallets");
    if (path === "/settings") return currentPath === "/settings" && !location.search.includes("tab=wallets");
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

  /* ------------------------------------------------------------------
     Shared nav link style helper
  ------------------------------------------------------------------ */
  const navLinkClass = (isActive: boolean) => cn("mf-neumo-nav-link flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors", isActive && "mf-nav-active");

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
              <span className="text-xs text-[#555555] font-medium">Asisten Keuangan Anda</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.path);
              return (
                <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} key={item.name} onClick={() => handleNavClick(item.path)} className={navLinkClass(isActive)}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </motion.button>
              );
            })}

            {/* Add Transaction - accent solid CTA (hidden if viewer) */}
            {activeRole !== "viewer" ? (
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} onClick={() => openQuickAdd("expense")} className="mf-add-transaction flex items-center gap-3 px-4 py-3 text-sm font-bold mt-4 transition-colors">
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
          <div onClick={() => navigate("/settings")} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#fafafa] border border-transparent hover:border-[#1e1e1e] transition-colors">
            <div className="h-9 w-9 bg-[#1e1e1e] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{user?.name?.substring(0, 2).toUpperCase() || "US"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none text-[#1e1e1e] tracking-tight">{user?.name || "User"}</p>
              <span className="text-[10px] text-[#555555] font-bold uppercase tracking-wider truncate block mt-0.5">
                {activeRole.toUpperCase()} · {activeWorkspace?.name || "Workspace"}
              </span>
            </div>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#a53a2b] border border-transparent hover:border-[#a53a2b] hover:bg-[#fafafa] transition-colors">
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
            {/* Overlay - fade in/out */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            {/* Drawer - slide from left */}
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.22, ease: "easeOut" }} className="mf-mobile-drawer relative w-64 max-w-xs p-6 flex flex-col justify-between h-full">
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#ff5722] flex items-center justify-center text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm text-[#1e1e1e] tracking-tight">MoneyFlow Pro</span>
                  </div>
                  {/* Square close button */}
                  <button onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavActive(item.path);
                    return (
                      <button key={item.name} onClick={() => handleNavClick(item.path)} className={navLinkClass(isActive)}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {item.name}
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
          MAIN CONTENT AREA (HEADER + SCREEN)
          ================================================================= */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-[64px] md:pb-0">
        {/* ---- HEADER - Swiss: black border-bottom, flat ---- */}
        <header className="mf-global-header h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger - square */}
            <button onClick={() => setIsSidebarOpen(true)} className="h-9 w-9 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] md:hidden hover:bg-[#1e1e1e] hover:text-white transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-base tracking-tight text-[#1e1e1e] hidden sm:block">{currentPath === "/" ? "Dashboard" : currentPath === "/transactions" ? "Daftar Transaksi" : currentPath === "/reports" ? "Analisis Keuangan" : currentPath === "/settings" ? "Pengaturan" : "Aplikasi"}</h2>
            {/* Mobile: logo icon */}
            <div className="h-8 w-8 bg-[#ff5722] flex items-center justify-center text-white sm:hidden">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          {/* ---- Header Controls ---- */}
          <div className="flex items-center gap-2">
            {/* Account Switcher - Swiss dropdown with Role Badge */}
            <div className="relative">
              <button type="button" onClick={() => setIsAccountOpen(!isAccountOpen)} className="mf-account-switcher flex items-center gap-2 px-3 py-1.5 text-xs font-bold cursor-pointer select-none hover:bg-[#f4f4f4] transition-colors border border-[#1e1e1e]">
                <div className="h-5 w-5 bg-[#ff5722] text-white flex items-center justify-center flex-shrink-0">
                  <UserRound className="h-3 w-3" />
                </div>
                <span className="truncate max-w-[85px] sm:max-w-none text-[#1e1e1e]">{activeWorkspace?.name || currentAccount.name}</span>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-[#1e1e1e]",
                    activeRole === "owner" && "bg-[#1e1e1e] text-white",
                    activeRole === "editor" && "bg-[#ff5722] text-white",
                    activeRole === "viewer" && "bg-[#f4f4f4] text-[#1e1e1e]"
                  )}
                >
                  {activeRole.toUpperCase()}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#555555] transition-transform duration-150", isAccountOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)} />
                    {/* Swiss dropdown - hard border, no radius, snappy motion */}
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute right-0 mt-0 w-60 border-2 border-[#1e1e1e] bg-[#fafafa] z-50">
                      {workspaces.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-[#1e1e1e] bg-[#f4f4f4]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#555555]">Ruang Keuangan (Workspace)</p>
                          </div>
                          {workspaces.map((ws) => {
                            const isSelected = ws.id === activeWorkspaceId;
                            const myRole = ws.owner_id === user?.id ? "owner" : (ws.members?.find((m) => m.user_id === user?.id)?.role || "viewer");
                            return (
                              <button
                                key={ws.id}
                                type="button"
                                onClick={async () => {
                                  await switchWorkspace(ws.id);
                                  setIsAccountOpen(false);
                                }}
                                className={cn("w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors border-b border-[#e8e8e8]", isSelected ? "bg-[#1e1e1e] text-white font-bold" : "text-[#1e1e1e] hover:bg-[#f4f4f4]")}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={cn("h-2 w-2 flex-shrink-0", isSelected ? "bg-[#ff5722]" : "bg-[#c4c4c4]")} />
                                  <span className="truncate">{ws.name}</span>
                                </div>
                                <span className={cn("text-[8px] font-bold uppercase px-1 border", isSelected ? "border-white text-white" : "border-[#1e1e1e] text-[#555555]")}>{myRole}</span>
                              </button>
                            );
                          })}
                        </>
                      )}
                      <div className="px-3 py-1.5 border-b border-[#1e1e1e] bg-[#f4f4f4]">
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#555555]">Simulasi Akun</p>
                      </div>
                      {accountOptions.map((opt) => {
                        const isSelected = opt.id === (user?.id || "local-user");
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={async () => {
                              await switchUser(opt.id);
                              setIsAccountOpen(false);
                            }}
                            className={cn("w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors border-b border-[#e8e8e8] last:border-b-0", isSelected ? "bg-[#f4f4f4] text-[#1e1e1e] font-bold" : "text-[#555555] hover:bg-[#ffffff]")}
                          >
                            <span className="truncate">{opt.name}</span>
                            {isSelected && <Check className="h-3 w-3 text-[#ff5722]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell - square */}
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="h-9 w-9 flex items-center justify-center border border-[#1e1e1e] bg-transparent text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors relative">
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-[#a53a2b] text-[10px] font-bold text-white flex items-center justify-center border border-[#f4f4f4]">{unreadNotifsCount}</span>}
              </button>

              {/* Notification Dropdown - Swiss flat with AnimatePresence */}
              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute right-0 mt-0 w-80 max-w-[90vw] bg-[#fafafa] border-2 border-[#1e1e1e] z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] bg-[#f4f4f4]">
                        <h3 className="font-bold text-sm text-[#1e1e1e] tracking-tight">Notifikasi</h3>
                        {unreadNotifsCount > 0 && (
                          <button onClick={handleMarkNotifsRead} className="text-xs font-bold text-[#ff5722] hover:text-[#1e1e1e] transition-colors uppercase tracking-wider">
                            Tandai Dibaca
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center text-[#555555] py-8 font-medium">Tidak ada notifikasi baru.</p>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div key={notif.id} onClick={() => handleNotifClick(notif)} className={cn("p-4 text-xs flex flex-col gap-1.5 cursor-pointer border-b border-[#e8e8e8] last:border-b-0 transition-colors hover:bg-[#f4f4f4]", !notif.is_read && "bg-[#fafafa] font-medium")}>
                              <div className="flex items-center justify-between">
                                <span className={cn("font-bold uppercase tracking-wider px-1.5 py-0.5 text-[9px] border", notif.type === "budget" && "border-[#a53a2b] text-[#a53a2b]", notif.type === "bill" && "border-[#ff5722] text-[#ff5722]", notif.type === "debt" && "border-[#9a5a21] text-[#9a5a21]", notif.type === "system" && "border-[#356342] text-[#356342]")}>{notif.type.toUpperCase()}</span>
                                <span className="text-[9px] text-[#555555]">{notif.created_at ? new Date(notif.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
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
                                    if (link.user1Status === "accepted" && link.user2Status === "accepted") link.active = true;
                                    setJointLink(link);
                                    await readNotification(user!.id, notif.id);
                                    showToast("Undangan diterima! Akun Bersama siap digunakan.", "success");
                                    if (link.active) showToast("Kedua akun telah terhubung! Akun Bersama aktif.", "success");
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

            {/* Profile Avatar - Swiss square, invert hover */}
            <div onClick={() => navigate("/settings")} className="h-9 w-9 bg-[#1e1e1e] hidden sm:flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-[#ff5722] transition-colors select-none border border-[#1e1e1e]">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>

        {/* Page Content - Smooth transition setiap ganti route */}
        <motion.main key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="mf-page-content flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </motion.main>
      </div>

      {/* =================================================================
          MOBILE BOTTOM NAVIGATION - Swiss: bordered, flat, square
          ================================================================= */}
      <nav aria-label="Navigasi utama" className="mf-bottom-nav fixed bottom-0 left-0 right-0 h-16 grid grid-cols-5 items-stretch z-40 md:hidden bg-[#f4f4f4]">
        {activeRole !== "viewer" && (
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-50 pointer-events-auto">
            <motion.button whileTap={{ scale: 0.92 }} type="button" onClick={() => openQuickAdd("expense")} aria-label="Catat Transaksi" className="h-12 w-12 shrink-0 aspect-square bg-[#ff5722] text-white flex items-center justify-center border-2 border-[#1e1e1e] hover:bg-[#e64a19] transition-colors cursor-pointer">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </motion.button>
          </div>
        )}

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = isNavActive(item.path);
          const isCenter = idx === 2; // Analitik slot (hidden by FAB)

          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "mf-bottom-link flex flex-col items-center justify-center gap-1 text-[#555555] transition-colors select-none cursor-pointer",
                isCenter && "pt-5 opacity-0 pointer-events-none", // Hidden under FAB
                isActive && "mf-bottom-active",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="text-[10px] tracking-tight font-semibold">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- QUICK ADD MODAL (Global) ---- */}
      <QuickAddModal isOpen={quickAddOpen} onClose={closeQuickAdd} initialType={quickAddType} />
    </div>
  );
};

export default AppLayout;
