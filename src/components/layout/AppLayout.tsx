/** @format */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Plus, BarChart3, Settings, Bell, LogOut, Menu, X, Wallet } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useFinanceStore } from "../../store/financeStore";
import { QuickAddModal } from "../transactions/QuickAddModal";
import { cn } from "../../lib/utils";
import { useSmartAlerts } from "../../hooks/useSmartAlerts";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, settings } = useAuthStore();
  const { notifications, readAllNotifications } = useFinanceStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Trigger alerts to register notifications in the background
  useSmartAlerts();

  const currentPath = location.pathname;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  // Sync dark mode class
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
    { name: "Add", path: "#add", icon: Plus, isFab: true },
    { name: "Laporan", path: "/reports", icon: BarChart3 },
    { name: "Pengaturan", path: "/settings", icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    if (path === "#add") {
      setIsQuickAddOpen(true);
    } else {
      navigate(path);
      setIsSidebarOpen(false);
    }
  };

  const handleMarkNotifsRead = () => {
    if (user) {
      readAllNotifications(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col md:flex-row transition-colors duration-200">
      {/* ---------------------------------------------------------------------
          DESKTOP SIDEBAR
          --------------------------------------------------------------------- */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/40 flex-col justify-between py-6 px-4 hidden md:flex transition-all duration-200")}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft">
              <Wallet className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none">MoneyFlow Pro</h1>
              <span className="text-xs text-text-mutedLight dark:text-text-mutedDark">Asisten Keuangan Anda</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              if (item.isFab) return null; // Add button handled separately
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button key={item.name} onClick={() => handleNavClick(item.path)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-text-mutedLight dark:text-text-mutedDark hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-light dark:hover:text-text-dark btn-pressable", isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/20 dark:hover:text-primary-light")}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </button>
              );
            })}

            {/* Quick Add Option on Sidebar */}
            <button onClick={() => setIsQuickAddOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mt-4 bg-primary text-white hover:bg-primary-dark shadow-soft btn-pressable">
              <Plus className="h-5 w-5" />
              Catat Transaksi
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-4">
          <div onClick={() => navigate("/settings")} className="flex items-center gap-3 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-all btn-pressable">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary-light font-bold">{user?.name?.substring(0, 2).toUpperCase() || "US"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-none">{user?.name || "User"}</p>
              <span className="text-xs text-text-mutedLight dark:text-text-mutedDark truncate">IDR Mode</span>
            </div>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 transition-colors btn-pressable">
            <LogOut className="h-5 w-5" />
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------------
          MOBILE SIDEBAR OVERLAY
          --------------------------------------------------------------------- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-full animate-fade-in shadow-xl">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm">MoneyFlow Pro</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  if (item.isFab) return null;
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button key={item.name} onClick={() => handleNavClick(item.path)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-text-mutedLight dark:text-text-mutedDark hover:bg-slate-50 dark:hover:bg-slate-800/50 btn-pressable", isActive && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light")}>
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div>
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 transition-colors btn-pressable"
              >
                <LogOut className="h-5 w-5" />
                Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MAIN CONTENT AREA (HEADER + SCREEN CONTENT)
          --------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-20 md:pb-0">
        {/* Header */}
        <header className="h-16 px-4 md:px-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-text-light dark:text-text-dark md:hidden btn-pressable">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-base md:text-lg hidden sm:block">{currentPath === "/" ? "Dashboard" : currentPath === "/transactions" ? "Daftar Transaksi" : currentPath === "/reports" ? "Analisis Keuangan" : currentPath === "/settings" ? "Pengaturan" : "Aplikasi"}</h2>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white sm:hidden">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          {/* Quick Stats / Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800/60 text-text-mutedLight dark:text-text-mutedDark flex items-center justify-center transition-colors relative btn-pressable">
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">{unreadNotifsCount}</span>}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-soft-md z-50 p-4 animate-slide-up">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 dark:border-slate-800/40">
                      <h3 className="font-bold text-sm">Notifikasi</h3>
                      {unreadNotifsCount > 0 && (
                        <button onClick={handleMarkNotifsRead} className="text-xs text-primary font-bold hover:underline">
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-center text-text-mutedLight dark:text-text-mutedDark py-6">Tidak ada notifikasi baru.</p>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div key={notif.id} className={cn("p-3 rounded-xl border border-slate-50 dark:border-slate-800/30 text-xs flex flex-col gap-1 transition-all", !notif.is_read ? "bg-slate-50/80 dark:bg-slate-800/40 font-medium" : "opacity-80")}>
                            <div className="flex items-center justify-between">
                              <span className={cn("font-bold rounded px-1.5 py-0.5 text-[9px]", notif.type === "budget" && "bg-danger/10 text-danger", notif.type === "bill" && "bg-primary/10 text-primary", notif.type === "debt" && "bg-warning/10 text-warning", notif.type === "system" && "bg-success/10 text-success")}>{notif.type.toUpperCase()}</span>
                              <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark">{notif.created_at ? new Date(notif.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                            </div>
                            <h4 className="font-bold text-xs mt-0.5 leading-tight">{notif.title}</h4>
                            <p className="text-text-mutedLight dark:text-text-mutedDark leading-normal">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar (Desktop/Tablet) */}
            <div onClick={() => navigate("/settings")} className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 hidden sm:flex items-center justify-center text-primary dark:text-primary-light font-bold text-sm cursor-pointer hover:border-primary transition-all btn-pressable">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>

        {/* Page Content Screen */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>

      {/* ---------------------------------------------------------------------
          MOBILE BOTTOM NAVIGATION BAR
          --------------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-around z-40 md:hidden px-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          if (item.isFab) {
            return (
              <div key={item.name} className="relative -top-4">
                <button onClick={() => setIsQuickAddOpen(true)} className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-all duration-200 active:scale-90 border-4 border-background-light dark:border-background-dark btn-pressable">
                  <Plus className="h-7 w-7" />
                </button>
              </div>
            );
          }

          return (
            <button key={item.name} onClick={() => handleNavClick(item.path)} className={cn("flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-text-mutedLight dark:text-text-mutedDark transition-all btn-pressable", isActive && "text-primary dark:text-primary-light font-bold")}>
              <Icon className={cn("h-5 w-5", isActive && "scale-110 text-primary dark:text-primary-light")} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ---------------------------------------------------------------------
          QUICK ADD MODAL (GLOBAL DIALOG)
          --------------------------------------------------------------------- */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  );
};
export default AppLayout;
