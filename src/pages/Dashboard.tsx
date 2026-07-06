/** @format */

import React, { useMemo, Suspense } from "react";
import { useFinanceStore } from "../store/financeStore";
import { useFinancialHealth } from "../hooks/useFinancialHealth";
import { useSmartAlerts } from "../hooks/useSmartAlerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Scale, AlertTriangle, Lightbulb, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LazyViewport } from "../components/ui/lazy-viewport";
import { BeginnerGuide } from "../components/ui/BeginnerGuide";

const LazyCashFlowTrendChart = React.lazy(() => import("../components/dashboard/DashboardCharts").then((m) => ({ default: m.CashFlowTrendChart })));
const LazyCategoryDistributionChart = React.lazy(() => import("../components/dashboard/DashboardCharts").then((m) => ({ default: m.CategoryDistributionChart })));

export const Dashboard: React.FC = () => {
  const { wallets, transactions, budgets, categories } = useFinanceStore();
  const health = useFinancialHealth();
  const alerts = useSmartAlerts();

  // Helper formatting currency
  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // 1. Calculate General Card Balances (June 2026)
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date + "T12:00:00");
      const today = new Date();
      return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    });
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }, [wallets]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const totalExpense = useMemo(() => {
    return currentMonthTransactions.filter((t) => t.type === "expense" || t.type === "installment").reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  // 2. Budget calculation
  const totalBudgetsLimit = useMemo(() => {
    const today = new Date();
    return budgets.filter((b) => b.month === today.getMonth() + 1 && b.year === today.getFullYear()).reduce((sum, b) => sum + b.amount, 0);
  }, [budgets]);

  const remainingBudgets = useMemo(() => {
    const today = new Date();
    const activeBudgets = budgets.filter((b) => b.month === today.getMonth() + 1 && b.year === today.getFullYear());
    const categoryIds = new Set(activeBudgets.map((b) => b.category_id));

    const spentOnBudgeted = currentMonthTransactions.filter((t) => (t.type === "expense" || t.type === "installment") && t.category_id && categoryIds.has(t.category_id)).reduce((sum, t) => sum + t.amount, 0);

    return Math.max(0, totalBudgetsLimit - spentOnBudgeted);
  }, [budgets, currentMonthTransactions, totalBudgetsLimit]);

  // 3. Category distribution (Donut chart data)
  const categoryChartData = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const spentMap: Record<string, number> = {};

    currentMonthTransactions
      .filter((t) => (t.type === "expense" || t.type === "installment") && t.category_id)
      .forEach((t) => {
        spentMap[t.category_id!] = (spentMap[t.category_id!] || 0) + t.amount;
      });

    return Object.keys(spentMap)
      .map((catId) => {
        const cat = categoryMap.get(catId);
        return {
          name: cat?.name || "Lainnya",
          value: spentMap[catId],
          color: cat?.color || "#6B7280",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions, categories]);

  // 4. Cash Flow Trend (Last 7 Days)
  const cashFlowTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const formattedDay = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      const dayIncome = transactions.filter((t) => t.date === dateStr && t.type === "income").reduce((sum, t) => sum + t.amount, 0);

      const dayExpense = transactions.filter((t) => t.date === dateStr && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);

      days.push({
        name: formattedDay,
        Pemasukan: dayIncome,
        Pengeluaran: dayExpense,
      });
    }
    return days;
  }, [transactions]);

  // 5. Automatic Smart Insights Generator (Indonesian)
  const smartInsights = useMemo(() => {
    const insights: string[] = [];

    // Coffee / Snack heuristic
    const coffeeSpent = currentMonthTransactions.filter((t) => t.description?.toLowerCase().includes("kopi") || t.description?.toLowerCase().includes("coffee") || t.description?.toLowerCase().includes("jajan")).reduce((sum, t) => sum + t.amount, 0);
    if (coffeeSpent > 100000) {
      insights.push(`Anda telah membelanjakan ${formatCurrency(coffeeSpent)} untuk jajan/kopi bulan ini.`);
    }

    // Largest Expense Category Heuristic
    if (categoryChartData.length > 0) {
      insights.push(`Pengeluaran terbesar bulan ini berada pada kategori '${categoryChartData[0].name}' (${formatCurrency(categoryChartData[0].value)}).`);
    }

    // Savings ratio insight
    if (health.savingsRatio >= 20) {
      insights.push(`Bagus! Anda menabung ${health.savingsRatio}% dari pendapatan, melampaui rasio ideal 20%.`);
    } else {
      insights.push(`Alokasi tabungan Anda baru ${health.savingsRatio}%. Usahakan menyisihkan minimal 20% di awal bulan.`);
    }

    // Rata-rata Harian
    const today = new Date();
    const totalDays = today.getDate(); // Use current day of month
    const averageDaily = totalExpense / totalDays;
    insights.push(`Rata-rata pengeluaran harian Anda adalah ${formatCurrency(Math.round(averageDaily))}.`);

    return insights;
  }, [currentMonthTransactions, categoryChartData, totalExpense, health]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
      <BeginnerGuide pageKey="dashboard" />
      {/* ---------------------------------------------------------------------
          SMART WARNING PANEL (Alert System)
          --------------------------------------------------------------------- */}
      {alerts.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border flex items-start gap-3 shadow-soft-sm ${alert.severity === "danger" ? "bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30 text-danger" : alert.severity === "warning" ? "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 text-warning" : "bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 text-primary"}`}>
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">{alert.title}</h4>
                <p className="text-xs text-text-light dark:text-text-dark opacity-90 mt-0.5 leading-normal">{alert.message}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ---------------------------------------------------------------------
          MACRO SUMMARY STATISTICS CARDS
          --------------------------------------------------------------------- */}
      <LazyViewport height="120px" className="w-full">
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
          {/* Total Saldo */}
          <Card className="col-span-2 overflow-hidden border-2 border-primary/10">
            <CardContent className="p-6 relative flex flex-col justify-between h-full min-h-[120px]">
              <div>
                <span className="text-xs font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">TOTAL SALDO</span>
                <h3 className="text-2xl md:text-3xl font-black text-primary mt-1 tracking-tight">{formatCurrency(totalBalance)}</h3>
              </div>
              <div className="absolute right-4 bottom-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <WalletIcon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Pemasukan Bulan Ini */}
          <Card>
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
              <div>
                <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">PEMASUKAN JUNI</span>
                <h4 className="text-base md:text-lg font-extrabold text-success mt-1">{formatCurrency(totalIncome)}</h4>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-success mt-2">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+ Masuk</span>
              </div>
            </CardContent>
          </Card>

          {/* Pengeluaran Bulan Ini */}
          <Card>
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
              <div>
                <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">PENGELUARAN JUNI</span>
                <h4 className="text-base md:text-lg font-extrabold text-danger mt-1">{formatCurrency(totalExpense)}</h4>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-danger mt-2">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>- Keluar</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </LazyViewport>

      {/* ---------------------------------------------------------------------
          HEALTH SCORE & WALLET STATUS
          --------------------------------------------------------------------- */}
      <LazyViewport height="280px" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Health Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Kesehatan Finansial
                </CardTitle>
                <CardDescription>Skor kepatuhan & alokasi tabungan</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {/* Radial or Big Score indicator */}
                <div className="flex items-center gap-4 py-2">
                  <div className="relative h-20 w-20 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{health.score}</span>
                    <span className="text-[9px] font-bold absolute bottom-2.5">/100</span>
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${health.statusColor}`}>{health.status}</h4>
                    <p className="text-xs text-text-mutedLight dark:text-text-mutedDark leading-normal mt-0.5">
                      Rasio tabungan: <span className="font-semibold">{health.savingsRatio}%</span>
                    </p>
                  </div>
                </div>

                {/* Financial tips list */}
                <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/30">
                  <h5 className="text-xs font-bold flex items-center gap-1.5 text-primary">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Saran Keuangan
                  </h5>
                  <ul className="list-disc pl-4 text-xs text-text-mutedLight dark:text-text-mutedDark flex flex-col gap-1.5 leading-relaxed">
                    {health.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallets & Budget Progress */}
          <motion.div variants={itemVariants} className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Wallets list summary */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <WalletIcon className="h-5 w-5 text-success" />
                  Dompet Terpisah ({wallets.length})
                </CardTitle>
                <CardDescription>Sisa saldo tiap rekening / e-wallet</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-800/20 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: wallet.color }}>
                        <WalletIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-none">{wallet.name}</h4>
                        <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark uppercase font-bold mt-1 inline-block">{wallet.type}</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-extrabold">{formatCurrency(wallet.balance)}</h4>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Budget progress card */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-warning" />
                  Anggaran Belanja
                </CardTitle>
                <CardDescription>Limit vs realisasi belanja bulan ini</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Sisa Limit Gabungan</span>
                    <span className="text-primary">{formatCurrency(remainingBudgets)}</span>
                  </div>
                  <Progress value={totalBudgetsLimit > 0 ? ((totalBudgetsLimit - remainingBudgets) / totalBudgetsLimit) * 100 : 0} colorVariant={remainingBudgets === 0 && totalBudgetsLimit > 0 ? "danger" : "default"} />
                </div>

                <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto pr-1 text-xs">
                  {budgets.length === 0 ? (
                    <p className="text-xs text-center text-text-mutedLight py-6">Belum ada batas anggaran dibuat.</p>
                  ) : (
                    budgets.map((b) => {
                      const spent = currentMonthTransactions.filter((t) => t.category_id === b.category_id && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);
                      const percent = Math.min(100, Math.round((spent / b.amount) * 100));
                      const isExceeded = spent > b.amount;
                      const cat = categories.find((c) => c.id === b.category_id);
                      return (
                        <div key={b.id} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span>{cat?.name || "Lainnya"}</span>
                            <span className={isExceeded ? "text-danger" : "text-text-mutedLight"}>
                              {percent}% ({formatCurrency(spent)} / {formatCurrency(b.amount)})
                            </span>
                          </div>
                          <Progress value={percent} colorVariant={isExceeded ? "danger" : "default"} className="h-1.5" />
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </LazyViewport>

      {/* ---------------------------------------------------------------------
          CHARTS SECTION (Expense distribution & Cash flow trend)
          --------------------------------------------------------------------- */}
      <LazyViewport height="350px" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Area Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tren Arus Kas (7 Hari Terakhir)
                </CardTitle>
                <CardDescription>Pemasukan vs pengeluaran harian</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                  <LazyCashFlowTrendChart data={cashFlowTrendData} />
                </Suspense>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense distribution Pie Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-danger" />
                  Distribusi Belanja
                </CardTitle>
                <CardDescription>Porsi pengeluaran berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent className="h-72 flex flex-col sm:flex-row items-center justify-center gap-4">
                {categoryChartData.length === 0 ? (
                  <p className="text-xs text-center text-text-mutedLight py-12 flex-1">Tidak ada transaksi belanja bulan ini.</p>
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                    <LazyCategoryDistributionChart data={categoryChartData} totalExpense={totalExpense} formatCurrency={formatCurrency} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </LazyViewport>

      {/* ---------------------------------------------------------------------
          SMART INSIGHTS CARDS
          --------------------------------------------------------------------- */}
      {smartInsights.length > 0 && (
        <LazyViewport height="150px" className="w-full">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  Wawasan Finansial Pintar (Smart Insights)
                </CardTitle>
                <CardDescription>Analisis otomatis pengeluaran harian Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {smartInsights.map((insight, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl text-xs font-semibold flex items-center gap-3 text-text-light dark:text-text-dark">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <span className="leading-relaxed">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </LazyViewport>
      )}
    </motion.div>
  );
};
export default Dashboard;
