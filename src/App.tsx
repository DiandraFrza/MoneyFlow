/** @format */

import React, { useEffect, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useFinanceStore } from "./store/financeStore";
import { useModalStore } from "./store/modalStore";
import { AppLayout } from "./components/layout/AppLayout";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { WalletConfigModal, BudgetConfigModal, DebtConfigModal, RecurringConfigModal, ProfileConfigModal } from "./components/modals";

// ============================================================
// LOADING SCREEN COMPONENT
// ============================================================
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Menyiapkan MoneyFlow Pro..." }) => (
  <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center gap-5">
    {/* Animated Logo */}
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-4xl shadow-lg">
        M
      </div>
      <div className="absolute -inset-2 rounded-3xl border-4 border-primary/20 animate-ping" />
    </div>
    {/* Spinner */}
    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-sm font-semibold text-text-mutedLight dark:text-text-mutedDark animate-pulse">{message}</p>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export const App: React.FC = () => {
  const { user, initialize, loading: authLoading } = useAuthStore();
  const { fetchData, loading: financeLoading, wallets, budgets, debts, recurring, lastFetchedUserId } = useFinanceStore();
  const { activeModal, selectedId } = useModalStore();

  // 1. Initialize Auth ONCE on mount — wait for session check before rendering anything
  useEffect(() => {
    console.log("[App] Inisialisasi auth...");
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch financial data when user.id becomes available or changes
  //    Guard: only fetch if user.id is different from lastFetchedUserId
  const triggerFetch = useCallback(async (userId: string) => {
    console.log("[App] Memulai fetch data untuk user:", userId);
    await fetchData(userId);
  }, [fetchData]);

  useEffect(() => {
    if (user?.id && user.id !== lastFetchedUserId) {
      console.log("[App] User tersedia, trigger fetchData. userId:", user.id);
      triggerFetch(user.id);
    }
  }, [user?.id, lastFetchedUserId, triggerFetch]);

  // ── PHASE 1: Auth masih loading (cek session Supabase) ──
  // Harus ditampilkan sebelum apapun untuk menghindari flickering ke halaman login
  if (authLoading) {
    return <LoadingScreen message="Mengecek sesi login Anda..." />;
  }

  // ── PHASE 2: Belum login ──
  if (!user) {
    return <Auth />;
  }

  // ── PHASE 3: Sudah login, data keuangan masih diambil ──
  // Tampilkan skeleton loading, bukan layar kosong
  return (
    <Router>
      <AppLayout>
        {/* Screen Loading Skeleton saat data keuangan masih loading */}
        {financeLoading ? (
          <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="h-24 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl animate-pulse w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="md:col-span-1 h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
              <div className="md:col-span-2 h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            {/* Catch all redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AppLayout>

      {/* Global Modal System */}
      <WalletConfigModal isOpen={activeModal === "wallet"} wallet={selectedId ? wallets.find((w) => w.id === selectedId) : undefined} />
      <BudgetConfigModal isOpen={activeModal === "budget"} budget={selectedId ? budgets.find((b) => b.id === selectedId) : undefined} />
      <DebtConfigModal isOpen={activeModal === "debt"} debt={selectedId ? debts.find((d) => d.id === selectedId) : undefined} />
      <RecurringConfigModal isOpen={activeModal === "recurring"} recurring={selectedId ? recurring.find((r) => r.id === selectedId) : undefined} />
      <ProfileConfigModal isOpen={activeModal === "profile"} />
    </Router>
  );
};

export default App;
