/** @format */

import React, { useState, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFinanceStore } from "../store/financeStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { LazyViewport } from "../components/ui/lazy-viewport";
import { BeginnerGuide } from "../components/ui/BeginnerGuide";
import { fadeUpVariant, staggerContainer } from "../utils/animation";
import { TrendingUp, TrendingDown, Scale, BarChart3, Plus } from "lucide-react";

const LazyCashFlowComparisonChart = React.lazy(() => import("../components/reports/ReportsCharts").then((m) => ({ default: m.CashFlowComparisonChart })));
const LazyBudgetPerformanceChart = React.lazy(() => import("../components/reports/ReportsCharts").then((m) => ({ default: m.BudgetPerformanceChart })));
const LazyExpensePropChart = React.lazy(() => import("../components/reports/ReportsCharts").then((m) => ({ default: m.ExpensePropChart })));
const LazyIncomePropChart = React.lazy(() => import("../components/reports/ReportsCharts").then((m) => ({ default: m.IncomePropChart })));

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, budgets, categories } = useFinanceStore();
  const [reportPeriod, setReportPeriod] = useState<string>("month");

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // 1. Filtered Transactions based on Selected Period
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter((t) => {
      const txDate = new Date(t.date + "T12:00:00");

      if (reportPeriod === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        return t.date === todayStr;
      }
      if (reportPeriod === "week") {
        const diffTime = today.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (reportPeriod === "month") {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      }
      if (reportPeriod === "year") {
        return txDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }, [transactions, reportPeriod]);

  // 2. Financial Metrics
  const totalIncome = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "expense" || t.type === "installment").reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalSavings = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRatio = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  // 3. Expense Distribution (Donut Chart)
  const expenseChartData = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const spentMap: Record<string, number> = {};

    filteredTransactions
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
  }, [filteredTransactions, categories]);

  // 4. Income Distribution (Donut Chart)
  const incomeChartData = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const incomeMap: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === "income" && t.category_id)
      .forEach((t) => {
        incomeMap[t.category_id!] = (incomeMap[t.category_id!] || 0) + t.amount;
      });

    return Object.keys(incomeMap)
      .map((catId) => {
        const cat = categoryMap.get(catId);
        return {
          name: cat?.name || "Lainnya",
          value: incomeMap[catId],
          color: cat?.color || "#10B981",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // 5. Budget Performance Chart Data
  const budgetPerformanceData = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const spentMap: Record<string, number> = {};

    transactions
      .filter((t) => {
        const txDate = new Date(t.date + "T12:00:00");
        const today = new Date();
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear() && (t.type === "expense" || t.type === "installment");
      })
      .forEach((t) => {
        if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] || 0) + t.amount;
      });

    const today = new Date();
    const activeBudgets = budgets.filter((b) => b.month === today.getMonth() + 1 && b.year === today.getFullYear());

    return activeBudgets.map((b) => {
      const cat = categoryMap.get(b.category_id);
      return {
        name: cat?.name || "Lainnya",
        "Limit Anggaran": b.amount,
        Terpakai: spentMap[b.category_id] || 0,
      };
    });
  }, [budgets, transactions, categories]);

  // 6. Cash Flow Trend for Selected Scope
  const trendData = useMemo(() => {
    const dataPoints: Record<string, { name: string; Pemasukan: number; Pengeluaran: number }> = {};
    const today = new Date();

    if (reportPeriod === "today") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      dataPoints[yesterdayStr] = { name: "Kemarin", Pemasukan: 0, Pengeluaran: 0 };
      dataPoints[todayStr] = { name: "Hari Ini", Pemasukan: 0, Pengeluaran: 0 };
    } else if (reportPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        dataPoints[dateStr] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    } else if (reportPeriod === "month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = d.toISOString().split("T")[0];
        const label = `${i}`;
        dataPoints[dateStr] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    } else if (reportPeriod === "year") {
      const year = today.getFullYear();
      for (let m = 0; m < 12; m++) {
        const label = new Date(year, m, 1).toLocaleDateString("id-ID", { month: "short" });
        const key = `${year}-${m + 1}`;
        dataPoints[key] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    }

    filteredTransactions.forEach((t) => {
      const txDate = new Date(t.date + "T12:00:00");
      let key = t.date;

      if (reportPeriod === "year") {
        key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
      }

      if (dataPoints[key]) {
        if (t.type === "income") {
          dataPoints[key].Pemasukan += t.amount;
        } else if (t.type === "expense" || t.type === "installment") {
          dataPoints[key].Pengeluaran += t.amount;
        }
      } else {
        const label = txDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        const val = { name: label, Pemasukan: 0, Pengeluaran: 0 };
        if (t.type === "income") {
          val.Pemasukan = t.amount;
        } else if (t.type === "expense" || t.type === "installment") {
          val.Pengeluaran = t.amount;
        }
        dataPoints[key] = val;
      }
    });

    return Object.keys(dataPoints)
      .sort()
      .map((key) => dataPoints[key]);
  }, [filteredTransactions, reportPeriod]);

  return (
    <div className="flex flex-col gap-6">
      <BeginnerGuide pageKey="reports" />

      {/* Scope Selector */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2 text-[#1e1e1e]">
                <BarChart3 className="h-5 w-5 text-[#ff5722]" />
                Laporan Analisis Lanjut
              </h2>
              <CardDescription className="mt-0.5">Analisis visual mendalam arus kas keuangan Anda.</CardDescription>
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                options={[
                  { value: "today", label: "Hari Ini" },
                  { value: "week", label: "7 Hari Terakhir" },
                  { value: "month", label: `Bulan Ini (${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date())})` },
                  { value: "year", label: `Tahun Ini (${new Date().getFullYear()})` },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------------------------------------------------------------------
          FINANCIAL SCORECARD RANGKUMAN (Staggered + Keyed by Period)
          --------------------------------------------------------------------- */}
      <motion.div key={`scorecard-${reportPeriod}`} variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Income Card */}
        <motion.div variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card className="bg-[#fafafa] border border-[#1e1e1e] h-full">
            <CardContent className="p-5">
              <span className="text-[10px] font-bold text-[#555555] tracking-wider uppercase">TOTAL MASUK</span>
              <h3 className="text-lg font-black text-[#356342] mt-1">{formatCurrency(totalIncome)}</h3>
              <span className="text-[10px] text-[#777777] mt-1.5 inline-block font-semibold">Semua Pemasukan</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Card */}
        <motion.div variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card className="bg-[#fafafa] border border-[#1e1e1e] h-full">
            <CardContent className="p-5">
              <span className="text-[10px] font-bold text-[#555555] tracking-wider uppercase">TOTAL KELUAR</span>
              <h3 className="text-lg font-black text-[#a53a2b] mt-1">{formatCurrency(totalExpense)}</h3>
              <span className="text-[10px] text-[#777777] mt-1.5 inline-block font-semibold">Rasio Belanja: {expenseRatio}%</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Card */}
        <motion.div variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card className="bg-[#fafafa] border border-[#1e1e1e] h-full">
            <CardContent className="p-5">
              <span className="text-[10px] font-bold text-[#555555] tracking-wider uppercase">TOTAL TABUNGAN</span>
              <h3 className="text-lg font-black text-[#9a5a21] mt-1">{formatCurrency(totalSavings)}</h3>
              <span className="text-[10px] text-[#777777] mt-1.5 inline-block font-semibold">Rasio Tabung: {savingsRatio}%</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Flow Card */}
        <motion.div variants={fadeUpVariant} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card className="bg-[#fafafa] border border-[#1e1e1e] h-full">
            <CardContent className="p-5">
              <span className="text-[10px] font-bold text-[#555555] tracking-wider uppercase">SELISIH BERSIH (NET)</span>
              <h3 className={`text-lg font-black mt-1 ${netCashFlow >= 0 ? "text-[#1e1e1e]" : "text-[#a53a2b]"}`}>
                {netCashFlow >= 0 ? "+" : ""}
                {formatCurrency(netCashFlow)}
              </h3>
              <span className="text-[10px] text-[#777777] mt-1.5 inline-block font-semibold">Sisa Arus Kas</span>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ---------------------------------------------------------------------
          TREND & BUDGET PERFORMANCE CHARTS
          --------------------------------------------------------------------- */}
      <LazyViewport height="280px" className="w-full">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash flow trends */}
          <motion.div variants={fadeUpVariant}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#ff5722]" />
                  Perbandingan Arus Kas
                </CardTitle>
                <CardDescription>Pemasukan vs pengeluaran dalam grafik visual</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {trendData.length === 0 ? (
                  <p className="text-xs text-center text-[#555555] py-20">Tidak ada data tren pada periode ini.</p>
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-[#f4f4f4] border border-[#1e1e1e] animate-pulse" />}>
                    <LazyCashFlowComparisonChart data={trendData} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Budget Performance */}
          <motion.div variants={fadeUpVariant}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#9a5a21]" />
                  Realisasi Anggaran vs Limit (Bulan Ini)
                </CardTitle>
                <CardDescription>Mendeteksi kepatuhan batas belanja kategori</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[280px] p-5">
                {budgetPerformanceData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#f4f4f4] border border-dashed border-[#1e1e1e]">
                    <div className="h-12 w-12 border border-[#1e1e1e] bg-[#ff5722] text-white flex items-center justify-center mb-3">
                      <Scale className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-sm text-[#1e1e1e]">Belum Ada Target Anggaran</h4>
                    <p className="text-xs text-[#555555] max-w-xs mt-1.5 mb-4 leading-relaxed">Atur batas belanja per kategori bulan ini untuk memantau kesehatan arus kas dan mendeteksi overspending lebih dini.</p>
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                      <Button size="sm" onClick={() => navigate("/settings?tab=budgets")} className="gap-2 font-bold text-xs cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Atur Anggaran Sekarang
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-[#f4f4f4] border border-[#1e1e1e] animate-pulse" />}>
                    <LazyBudgetPerformanceChart data={budgetPerformanceData} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </LazyViewport>

      {/* ---------------------------------------------------------------------
          DISTRIBUTIONS (INCOME VS EXPENSE)
          --------------------------------------------------------------------- */}
      <LazyViewport height="320px" className="w-full">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense distribution */}
          <motion.div variants={fadeUpVariant}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-[#a53a2b]" />
                  Proporsi Pengeluaran
                </CardTitle>
                <CardDescription>Porsi belanja per kategori pilihan</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[280px] p-5">
                {expenseChartData.length === 0 ? (
                  <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[#f4f4f4] border border-dashed border-[#1e1e1e]">
                    <div className="h-10 w-10 border border-[#1e1e1e] bg-[#a53a2b] text-white flex items-center justify-center mb-2">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1e1e1e]">Tidak Ada Data Belanja</p>
                    <p className="text-[11px] text-[#555555] mt-0.5">Belum ada pengeluaran tercatat pada periode ini.</p>
                  </div>
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-[#f4f4f4] border border-[#1e1e1e] animate-pulse" />}>
                    <LazyExpensePropChart data={expenseChartData} totalExpense={totalExpense} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Income distribution */}
          <motion.div variants={fadeUpVariant}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#356342]" />
                  Proporsi Pendapatan
                </CardTitle>
                <CardDescription>Porsi pemasukan per kategori pilihan</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[280px] p-5">
                {incomeChartData.length === 0 ? (
                  <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[#f4f4f4] border border-dashed border-[#1e1e1e]">
                    <div className="h-10 w-10 border border-[#1e1e1e] bg-[#356342] text-white flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1e1e1e]">Tidak Ada Data Pemasukan</p>
                    <p className="text-[11px] text-[#555555] mt-0.5">Belum ada pendapatan tercatat pada periode ini.</p>
                  </div>
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-[#f4f4f4] border border-[#1e1e1e] animate-pulse" />}>
                    <LazyIncomePropChart data={incomeChartData} totalIncome={totalIncome} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </LazyViewport>
    </div>
  );
};

export default Reports;
