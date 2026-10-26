/** @format */

import React, { useEffect, useCallback, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useFinanceStore } from "./store/financeStore";
import { useModalStore } from "./store/modalStore";
import { AppLayout } from "./components/layout/AppLayout";
import { Wallet } from "lucide-react";
const Auth = React.lazy(() => import("./pages/Auth").then((m) => ({ default: m.Auth })));
const Dashboard = React.lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Transactions = React.lazy(() => import("./pages/Transactions").then((m) => ({ default: m.Transactions })));
const Reports = React.lazy(() => import("./pages/Reports").then((m) => ({ default: m.Reports })));
const Settings = React.lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const SplitBillPage = React.lazy(() => import("./pages/SplitBill").then((m) => ({ default: m.SplitBillPage })));

const WalletConfigModal = React.lazy(() => import("./components/modals/WalletConfigModal").then((m) => ({ default: m.WalletConfigModal })));
const BudgetConfigModal = React.lazy(() => import("./components/modals/BudgetConfigModal").then((m) => ({ default: m.BudgetConfigModal })));
const DebtConfigModal = React.lazy(() => import("./components/modals/DebtConfigModal").then((m) => ({ default: m.DebtConfigModal })));
const RecurringConfigModal = React.lazy(() => import("./components/modals/RecurringConfigModal").then((m) => ({ default: m.RecurringConfigModal })));
const ProfileConfigModal = React.lazy(() => import("./components/modals/ProfileConfigModal").then((m) => ({ default: m.ProfileConfigModal })));
import { ToastContainer } from "./components/ui/ToastContainer";
import { ConfirmModal } from "./components/modals/ConfirmModal";
import { ActorPromptModal } from "./components/modals/ActorPromptModal";

// ============================================================
// LOADING SCREEN COMPONENT (Swiss Circular Loading)
// ============================================================
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Menyiapkan MoneyFlow Pro..." }) => (
  <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center gap-6 select-none">
    {/* Animated Circular Logo */}
    <div className="relative">
      <div className="h-20 w-20 rounded-full bg-[#ff5722] flex items-center justify-center text-white border-2">
        <Wallet className="h-9 w-9 stroke-[2.2]" />
      </div>
      <div className="absolute -inset-2 rounded-full border-2 border-[#ff5722]/30 animate-ping pointer-events-none" />
    </div>
    {/* Circular Spinner */}
    <div className="h-9 w-9 border-[3.5px] border-[#1e1e1e]/15 border-t-[#ff5722] rounded-full animate-spin" />
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1e1e1e] animate-pulse">{message}</p>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export const App: React.FC = () => {
  const { user, initialize, loading: authLoading } = useAuthStore();
  const { fetchData, loading: financeLoading, wallets, budgets, debts, recurring, lastFetchedUserId } = useFinanceStore();
  const { activeModal, selectedId } = useModalStore();

  // State to track which modals have been opened at least once to handle lazy loading + exit animations
  const [openedModals, setOpenedModals] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeModal) {
      setOpenedModals((prev) => ({ ...prev, [activeModal]: true }));
    }
  }, [activeModal]);

  // 1. Initialize Auth ONCE on mount - wait for session check before rendering anything
  useEffect(() => {
    console.log("[App] Inisialisasi auth...");
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch financial data when user.id becomes available or changes
  //    Guard: only fetch if user.id is different from lastFetchedUserId
  const triggerFetch = useCallback(
    async (userId: string) => {
      console.log("[App] Memulai fetch data untuk user:", userId);
      await fetchData(userId);
    },
    [fetchData],
  );

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
    return (
      <Suspense fallback={<LoadingScreen message="Menyiapkan layar login..." />}>
        <Auth />
      </Suspense>
    );
  }

  // ── PHASE 3: Sudah login, data keuangan masih diambil ──
  // Tampilkan skeleton loading, bukan layar kosong
  return (
    <Router>
      <AppLayout>
        {/* Screen Loading Skeleton saat data keuangan masih loading */}
        {financeLoading ? (
          <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="h-24 bg-[#e5e5e5] border border-[#1e1e1e] animate-pulse w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-[#e5e5e5] border border-[#1e1e1e] animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="md:col-span-1 h-64 bg-[#e5e5e5] border border-[#1e1e1e] animate-pulse" />
              <div className="md:col-span-2 h-64 bg-[#e5e5e5] border border-[#1e1e1e] animate-pulse" />
            </div>
          </div>
        ) : (
          <Suspense fallback={<LoadingScreen message="Memuat halaman..." />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/split-bill" element={<SplitBillPage />} />
              {/* Catch all redirect to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        )}
      </AppLayout>

      {/* Global Modal System */}
      <Suspense fallback={null}>
        {openedModals["wallet"] && <WalletConfigModal isOpen={activeModal === "wallet"} wallet={selectedId ? wallets.find((w) => w.id === selectedId) : undefined} />}
        {openedModals["budget"] && <BudgetConfigModal isOpen={activeModal === "budget"} budget={selectedId ? budgets.find((b) => b.id === selectedId) : undefined} />}
        {openedModals["debt"] && <DebtConfigModal isOpen={activeModal === "debt"} debt={selectedId ? debts.find((d) => d.id === selectedId) : undefined} />}
        {openedModals["recurring"] && <RecurringConfigModal isOpen={activeModal === "recurring"} recurring={selectedId ? recurring.find((r) => r.id === selectedId) : undefined} />}
        {openedModals["profile"] && <ProfileConfigModal isOpen={activeModal === "profile"} />}
      </Suspense>

      {/* Global Toast Alerts & Custom Confirmation Modal */}
      <ToastContainer />
      <ConfirmModal />
      <ActorPromptModal />
    </Router>
  );
};

export default App;
