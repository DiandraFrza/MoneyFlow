/** @format */

import React, { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowDown, ArrowLeftRight, ArrowUpRight, ArrowUp, ChevronRight, CircleHelp, CreditCard, Eye, EyeOff, Plus, Search, Sparkles, Users, Wallet } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useFinanceStore } from "../store/financeStore";
import { useModalStore } from "../store/modalStore";
import { BeginnerGuide } from "../components/ui/BeginnerGuide";
import { fadeUpVariant, staggerContainer } from "../utils/animation";
import "../dashboard.css";

const LazyCashFlowTrendChart = React.lazy(() => import("../components/dashboard/DashboardCharts").then((module) => ({ default: module.CashFlowTrendChart })));

const currency = (amount: number) => `Rp ${amount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const displayDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

const greetingForHour = (hour: number) => {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, workspaces, activeWorkspaceId, activeRole, switchWorkspace } = useAuthStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isSharedWorkspace = activeWorkspace?.type === "couple" || activeWorkspace?.type === "family" || (activeWorkspace?.members && activeWorkspace.members.length > 1);

  // Privacy Mode (Persisted in localStorage)
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    return typeof localStorage !== "undefined" ? localStorage.getItem("mf_privacy_mode") === "true" : false;
  });

  const togglePrivacy = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("mf_privacy_mode", String(next));
      window.dispatchEvent(new Event("mf_privacy_change"));
      return next;
    });
  };

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

  const formatAmount = (amount: number) => (isBalanceHidden ? "Rp ••••••••" : currency(amount));
  const { wallets, transactions, transfers, categories } = useFinanceStore();
  const openQuickAdd = useModalStore((state) => state.openQuickAdd);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999), [today]);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const previousMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth() - 1, 1), [today]);
  const previousMonthEnd = monthStart;
  const monthName = today.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const currentMonthTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const date = new Date(`${transaction.date}T12:00:00`);
        return date >= monthStart && date <= todayEnd;
      }),
    [transactions, monthStart, todayEnd],
  );

  const previousMonthTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const date = new Date(`${transaction.date}T12:00:00`);
        return date >= previousMonthStart && date < previousMonthEnd;
      }),
    [transactions, previousMonthStart, previousMonthEnd],
  );

  const totalBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
  const totalIncome = currentMonthTransactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0);
  const totalExpense = currentMonthTransactions.filter((transaction) => transaction.type === "expense" || transaction.type === "installment").reduce((total, transaction) => total + transaction.amount, 0);
  const previousIncome = previousMonthTransactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0);
  const previousExpense = previousMonthTransactions.filter((transaction) => transaction.type === "expense" || transaction.type === "installment").reduce((total, transaction) => total + transaction.amount, 0);

  const percentageChange = (current: number, previous: number) => (previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100));
  const incomeChange = percentageChange(totalIncome, previousIncome);
  const expenseChange = percentageChange(totalExpense, previousExpense);

  const chartData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dateString = localDateString(date);
        const dayTransactions = transactions.filter((transaction) => transaction.date === dateString);
        return {
          name: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          Pemasukan: dayTransactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0),
          Pengeluaran: dayTransactions.filter((transaction) => transaction.type === "expense" || transaction.type === "installment").reduce((total, transaction) => total + transaction.amount, 0),
        };
      }),
    [transactions],
  );

  const recentTransactions = useMemo(() => {
    const transactionActivity = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      amount: transaction.amount,
      description: transaction.description || "Transaksi",
      type: transaction.type,
      walletId: transaction.wallet_id,
      categoryId: transaction.category_id,
      created_by_name: transaction.created_by_name || (transaction as any).actor_name,
    }));
    const transferActivity = transfers.map((transfer) => ({
      id: transfer.id,
      date: transfer.date,
      amount: transfer.amount,
      description: transfer.description || "Transfer antar dompet",
      type: "transfer" as const,
      walletId: transfer.from_wallet_id,
      categoryId: null,
      created_by_name: (transfer as any).created_by_name || undefined,
    }));

    return [...transactionActivity, ...transferActivity]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((activity) => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return true;
        const categoryName = categories.find((category) => category.id === activity.categoryId)?.name || "";
        const walletName = wallets.find((wallet) => wallet.id === activity.walletId)?.name || "";
        return `${activity.description} ${categoryName} ${walletName}`.toLocaleLowerCase().includes(query);
      })
      .slice(0, 5);
  }, [transactions, transfers, categories, wallets, search]);

  const greeting = greetingForHour(today.getHours());
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Teman";

  return (
    <div className="mf-dashboard">
      <BeginnerGuide pageKey="dashboard" />

      {/* HEADER: Animasi muncul halus dari atas */}
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="mf-dashboard-heading">
        <div>
          <p className="mf-eyebrow">{today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1>
            {greeting}, {firstName}{" "}
            <motion.span aria-hidden="true" animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }} style={{ display: "inline-block", color: "#ff5722" }}>
              ✦
            </motion.span>
          </h1>
          <p className="mf-heading-caption">Berikut ringkasan keuanganmu hari ini.</p>
        </div>
        <div className="mf-dashboard-controls">
          <div className={`mf-search${searchOpen ? " mf-search-open" : ""}`} role="search">
            <button type="button" className="mf-search-trigger" onClick={() => setSearchOpen((open) => !open)} aria-label={searchOpen ? "Tutup pencarian" : "Cari transaksi"}>
              <Search aria-hidden="true" size={18} />
            </button>
            <span id="dashboard-search-label" className="sr-only">
              Cari transaksi terbaru
            </span>
            <input
              ref={searchInputRef}
              type="search"
              aria-labelledby="dashboard-search-label"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && search.trim()) {
                  navigate(`/transactions?search=${encodeURIComponent(search.trim())}`);
                }
              }}
              className="mf-search-input"
              style={{ border: "none", outline: "none", boxShadow: "none", background: "transparent" }}
            />
            <kbd onClick={() => searchInputRef.current?.focus()} style={{ cursor: "pointer" }}>
              /
            </kbd>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="mf-avatar" onClick={() => navigate("/settings")} aria-label={`Buka pengaturan profil ${user?.name || ""}`}>
            {user?.photo_url ? <img src={user.photo_url} alt="" /> : firstName.slice(0, 1).toUpperCase()}
          </motion.button>
        </div>
      </motion.header>

      {/* RUANG BERSAMA CONTEXT BANNER */}
      {isSharedWorkspace && activeWorkspace && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 border-2 border-[#1e1e1e] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#1e1e1e] text-[#ff5722] flex items-center justify-center font-black shrink-0 border border-[#1e1e1e]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5722]">Ruang Bersama Aktif</span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1e1e1e] bg-[#f4f4f4] text-[#1e1e1e]">{activeWorkspace.type}</span>
              </div>
              <h3 className="text-base font-black text-[#1e1e1e] leading-tight mt-0.5">{activeWorkspace.name}</h3>
              <p className="text-xs text-[#555555] font-medium mt-0.5">
                Peran Anda: <strong className="text-[#1e1e1e] uppercase">{activeRole}</strong> ({activeRole === "owner" ? "Pemilik Ruang" : activeRole === "editor" ? "Bisa Catat & Edit" : "Hanya Melihat"})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {workspaces.find((w) => w.type === "personal" && w.owner_id === user?.id) && (
              <button
                type="button"
                onClick={() => {
                  const personal = workspaces.find((w) => w.type === "personal" && w.owner_id === user?.id);
                  if (personal) switchWorkspace(personal.id);
                }}
                className="px-3 py-1.5 border border-[#1e1e1e] bg-[#fafafa] hover:bg-[#1e1e1e] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                ← Kembali ke Ruang Pribadi
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* OVERVIEW GRID: Kartu muncul berurutan (Stagger) */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="mf-overview-grid" aria-label="Ringkasan keuangan">
        <motion.article variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="mf-balance-card">
          <div className="mf-balance-top">
            <div>
              <div className="flex items-center gap-2">
                <p className="mf-card-label">Total saldo</p>
                <button type="button" onClick={togglePrivacy} className="h-6 w-6 flex items-center justify-center border border-[#1e1e1e] bg-[#ffffff] hover:bg-[#1e1e1e] hover:text-white text-[#1e1e1e] transition-colors cursor-pointer" title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo (Privacy Mode)"} aria-label={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}>
                  {isBalanceHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="mf-balance-amount">{formatAmount(totalBalance)}</p>
            </div>
            <span className="mf-balance-icon" aria-hidden="true">
              <Wallet size={23} />
            </span>
          </div>
          <div className="mf-balance-footer">
            <span className="mf-balance-note">
              <Sparkles size={15} /> Semua dompet, satu tempat
            </span>
            <button type="button" onClick={() => navigate("/settings?tab=wallets")}>
              Detail saldo <ChevronRight size={15} />
            </button>
          </div>
        </motion.article>

        <motion.article variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="mf-stat-card">
          <span className="mf-stat-icon mf-stat-icon-income">
            <ArrowDownLeft size={19} />
          </span>
          <p className="mf-card-label">Pemasukan · {monthName}</p>
          <p className="mf-stat-amount">{formatAmount(totalIncome)}</p>
          <p className="mf-stat-change mf-positive">
            <ArrowUp size={14} /> {incomeChange}% dari bulan lalu
          </p>
        </motion.article>

        <motion.article variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="mf-stat-card">
          <span className="mf-stat-icon mf-stat-icon-expense">
            <ArrowUpRight size={19} />
          </span>
          <p className="mf-card-label">Pengeluaran · {monthName}</p>
          <p className="mf-stat-amount">{formatAmount(totalExpense)}</p>
          <p className={`mf-stat-change ${expenseChange <= 0 ? "mf-positive" : "mf-negative"}`}>
            {expenseChange > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(expenseChange)}% dari bulan lalu
          </p>
        </motion.article>
      </motion.section>

      {/* QUICK ACTIONS: Muncul saat di-scroll */}
      <motion.section variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="mf-section mf-quick-section" aria-labelledby="quick-actions-title">
        <div className="mf-section-heading">
          <div>
            <h2 id="quick-actions-title">Aksi cepat</h2>
            <p>Catat uang masuk, keluar, atau pindahkan saldo.</p>
          </div>
          <CircleHelp size={19} aria-hidden="true" />
        </div>
        <div className="mf-quick-actions">
          {activeRole === "viewer" && <div className="p-3 border border-[#1e1e1e] bg-[#f4f4f4] flex items-center justify-center col-span-2 sm:col-span-4 text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">Aksi Catat Dinonaktifkan (Role: Viewer)</div>}
          <motion.button whileHover={activeRole !== "viewer" ? { y: -2 } : {}} whileTap={activeRole !== "viewer" ? { scale: 0.98 } : {}} type="button" disabled={activeRole === "viewer"} onClick={() => openQuickAdd("transfer")} className={`mf-action-button ${activeRole === "viewer" ? "opacity-40 cursor-not-allowed" : ""}`}>
            <span className="mf-action-icon mf-action-icon-kirim">
              <ArrowUpRight size={20} />
            </span>
            <span>
              <strong>Kirim</strong>
              <small>Transfer saldo</small>
            </span>
          </motion.button>
          <motion.button whileHover={activeRole !== "viewer" ? { y: -2 } : {}} whileTap={activeRole !== "viewer" ? { scale: 0.98 } : {}} type="button" disabled={activeRole === "viewer"} onClick={() => openQuickAdd("income")} className={`mf-action-button ${activeRole === "viewer" ? "opacity-40 cursor-not-allowed" : ""}`}>
            <span className="mf-action-icon mf-action-icon-terima">
              <ArrowDownLeft size={20} />
            </span>
            <span>
              <strong>Terima</strong>
              <small>Catat pemasukan</small>
            </span>
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => navigate("/split-bill")} className="mf-action-button">
            <span className="mf-action-icon bg-[#ff5722] text-white">
              <Users size={20} className="text-[#1e1e1e]" />
            </span>
            <span>
              <strong>Split Bill</strong>
              <small>Patungan cepat</small>
            </span>
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => navigate("/settings?tab=wallets")} className="mf-action-button">
            <span className="mf-action-icon mf-action-icon-dompet">
              <CreditCard size={20} />
            </span>
            <span>
              <strong>Dompet</strong>
              <small>Kelola rekening</small>
            </span>
          </motion.button>
        </div>
      </motion.section>

      {/* CONTENT GRID: Panel Transaksi & Grafik muncul berurutan saat di-scroll ke bawah */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className="mf-content-grid">
        <motion.article variants={fadeUpVariant} className="mf-panel mf-activity-panel">
          <div className="mf-panel-heading">
            <div>
              <h2>Transaksi terbaru</h2>
              <p>Aktivitas keuangan terakhirmu</p>
            </div>
            <button type="button" className="mf-text-link" onClick={() => navigate("/transactions")}>
              Lihat semua <ChevronRight size={16} />
            </button>
          </div>
          <div className="mf-activity-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((activity, index) => {
                const isIncome = activity.type === "income";
                const isTransfer = activity.type === "transfer";
                const category = categories.find((item) => item.id === activity.categoryId);
                const wallet = wallets.find((item) => item.id === activity.walletId);
                const iconBg = category?.color || (isIncome ? "var(--mf-green)" : isTransfer ? "#2563eb" : "var(--mf-accent)");
                return (
                  <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: index * 0.06 }} whileHover={{ x: 4 }} className="mf-activity-row" key={`${activity.type}-${activity.id}`}>
                    <span className={`mf-activity-icon ${isIncome ? "mf-income-bg" : isTransfer ? "mf-transfer-bg" : "mf-expense-bg"}`} style={{ backgroundColor: iconBg, color: "#ffffff" }}>
                      {isIncome ? <ArrowDownLeft size={18} /> : isTransfer ? <ArrowLeftRight size={18} /> : <ArrowUpRight size={18} />}
                    </span>
                    <div className="mf-activity-description">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong>{activity.description}</strong>
                        {activity.created_by_name && isSharedWorkspace && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 border border-[#1e1e1e] bg-[#f4f4f4] text-[#1e1e1e]">Oleh: {activity.created_by_name}</span>}
                      </div>
                      <span>
                        {category?.name || (isTransfer ? "Transfer" : "Transaksi")} · {wallet?.name || "Dompet"} · {displayDate(activity.date)}
                      </span>
                    </div>
                    <strong className={`mf-activity-amount ${isIncome ? "mf-positive" : ""}`}>
                      {isIncome ? "+" : isTransfer ? "" : "−"}
                      {formatAmount(activity.amount)}
                    </strong>
                  </motion.div>
                );
              })
            ) : (
              <div className="mf-empty-state">
                <span className="mf-empty-icon">
                  <Wallet size={22} />
                </span>
                <strong>{search.trim() ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</strong>
                <span>{search.trim() ? "Coba kata kunci lainnya." : "Catat transaksi pertamamu untuk mulai melihat ringkasan."}</span>
                {!search.trim() && activeRole !== "viewer" && (
                  <button type="button" onClick={() => openQuickAdd("expense")}>
                    Catat transaksi <Plus size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.article>

        <motion.article variants={fadeUpVariant} className="mf-panel mf-chart-panel">
          <div className="mf-panel-heading">
            <div>
              <h2>Arus kas</h2>
              <p>Pemasukan dan pengeluaran · 7 hari</p>
            </div>
            <span className="mf-chart-badge">Minggu ini</span>
          </div>
          <div className="mf-chart-legend" aria-label="Legenda grafik">
            <span>
              <i className="mf-legend-income" /> Pemasukan
            </span>
            <span>
              <i className="mf-legend-expense" /> Pengeluaran
            </span>
          </div>
          <div className="mf-chart-container">
            <Suspense
              fallback={
                <div className="mf-chart-loading" role="status">
                  Memuat grafik...
                </div>
              }
            >
              <LazyCashFlowTrendChart data={chartData} />
            </Suspense>
          </div>
        </motion.article>
      </motion.section>
    </div>
  );
};

export default Dashboard;
