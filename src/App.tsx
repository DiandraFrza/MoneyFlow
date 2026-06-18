import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFinanceStore } from './store/financeStore';
import { AppLayout } from './components/layout/AppLayout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const { user, initialize, loading: authLoading } = useAuthStore();
  const { fetchData, loading: financeLoading } = useFinanceStore();

  // 1. Initialize Auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Fetch financial data when user logs in or profile updates
  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user, fetchData]);

  // Render spinner if auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-text-mutedLight dark:text-text-mutedDark animate-pulse">
          Menyiapkan Dompet MoneyFlow Pro...
        </span>
      </div>
    );
  }

  // If not logged in (user is null), send to Auth screen
  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <AppLayout>
        {/* Screen Loading Skeleton Overlay */}
        {financeLoading ? (
          <div className="flex flex-col gap-6 w-full">
            {/* Header skeletal */}
            <div className="h-20 bg-slate-200/50 dark:bg-slate-800/40 rounded-xl animate-pulse w-full"></div>
            {/* Grid layout cards skeletal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200/50 dark:bg-slate-800/40 rounded-xl animate-pulse"></div>
              ))}
            </div>
            {/* Main container skeletal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="md:col-span-1 h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-xl animate-pulse"></div>
              <div className="md:col-span-2 h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-xl animate-pulse"></div>
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
    </Router>
  );
};

export default App;
