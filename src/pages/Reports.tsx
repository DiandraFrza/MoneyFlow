import React, { useState, useMemo, Suspense } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { LazyViewport } from '../components/ui/lazy-viewport';

import { 
  TrendingUp, TrendingDown, Scale, BarChart3
} from 'lucide-react';

const LazyCashFlowComparisonChart = React.lazy(() =>
  import("../components/reports/ReportsCharts").then((m) => ({ default: m.CashFlowComparisonChart }))
);
const LazyBudgetPerformanceChart = React.lazy(() =>
  import("../components/reports/ReportsCharts").then((m) => ({ default: m.BudgetPerformanceChart }))
);
const LazyExpensePropChart = React.lazy(() =>
  import("../components/reports/ReportsCharts").then((m) => ({ default: m.ExpensePropChart }))
);
const LazyIncomePropChart = React.lazy(() =>
  import("../components/reports/ReportsCharts").then((m) => ({ default: m.IncomePropChart }))
);


export const Reports: React.FC = () => {
  const { transactions, budgets, categories } = useFinanceStore();
  const [reportPeriod, setReportPeriod] = useState<string>('month');

  // Helper formatting currency
  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // 1. Filtered Transactions based on Selected Period (June 2026)
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      
      if (reportPeriod === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return t.date === todayStr;
      }
      if (reportPeriod === 'week') {
        const diffTime = today.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (reportPeriod === 'month') {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      }
      if (reportPeriod === 'year') {
        return txDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }, [transactions, reportPeriod]);

  // 2. Financial Metrics
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'installment')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalSavings = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRatio = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  // 3. Expense Distribution (Donut Chart)
  const expenseChartData = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const spentMap: Record<string, number> = {};

    filteredTransactions
      .filter(t => (t.type === 'expense' || t.type === 'installment') && t.category_id)
      .forEach(t => {
        spentMap[t.category_id!] = (spentMap[t.category_id!] || 0) + t.amount;
      });

    return Object.keys(spentMap).map(catId => {
      const cat = categoryMap.get(catId);
      return {
        name: cat?.name || 'Lainnya',
        value: spentMap[catId],
        color: cat?.color || '#6B7280'
      };
    }).sort((a,b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // 4. Income Distribution (Donut Chart)
  const incomeChartData = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const incomeMap: Record<string, number> = {};

    filteredTransactions
      .filter(t => t.type === 'income' && t.category_id)
      .forEach(t => {
        incomeMap[t.category_id!] = (incomeMap[t.category_id!] || 0) + t.amount;
      });

    return Object.keys(incomeMap).map(catId => {
      const cat = categoryMap.get(catId);
      return {
        name: cat?.name || 'Lainnya',
        value: incomeMap[catId],
        color: cat?.color || '#10B981'
      };
    }).sort((a,b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // 5. Budget Performance Chart Data
  const budgetPerformanceData = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const spentMap: Record<string, number> = {};

    transactions
      .filter(t => {
        const txDate = new Date(t.date + 'T12:00:00');
        const today = new Date();
        // Filter transactions for current month
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear() && (t.type === 'expense' || t.type === 'installment');
      })
      .forEach(t => {
        if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] || 0) + t.amount;
      });

    const today = new Date();
    const activeBudgets = budgets.filter(b => b.month === today.getMonth() + 1 && b.year === today.getFullYear());
    
    return activeBudgets.map(b => {
      const cat = categoryMap.get(b.category_id);
      return {
        name: cat?.name || 'Lainnya',
        'Limit Anggaran': b.amount,
        'Terpakai': spentMap[b.category_id] || 0
      };
    });
  }, [budgets, transactions, categories]);

  // 6. Cash Flow Trend for Selected Scope
  const trendData = useMemo(() => {
    const dataPoints: Record<string, { name: string; Pemasukan: number; Pengeluaran: number }> = {};
    const today = new Date();

    if (reportPeriod === 'today') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      dataPoints[yesterdayStr] = { name: 'Kemarin', Pemasukan: 0, Pengeluaran: 0 };
      dataPoints[todayStr] = { name: 'Hari Ini', Pemasukan: 0, Pengeluaran: 0 };
    }
    else if (reportPeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        dataPoints[dateStr] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    }
    else if (reportPeriod === 'month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = d.toISOString().split('T')[0];
        const label = `${i}`;
        dataPoints[dateStr] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    }
    else if (reportPeriod === 'year') {
      const year = today.getFullYear();
      for (let m = 0; m < 12; m++) {
        const label = new Date(year, m, 1).toLocaleDateString('id-ID', { month: 'short' });
        const key = `${year}-${m + 1}`;
        dataPoints[key] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }
    }

    filteredTransactions.forEach(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      let key = t.date;
      
      if (reportPeriod === 'year') {
        key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
      }

      if (dataPoints[key]) {
        if (t.type === 'income') {
          dataPoints[key].Pemasukan += t.amount;
        } else if (t.type === 'expense' || t.type === 'installment') {
          dataPoints[key].Pengeluaran += t.amount;
        }
      } else {
        const label = txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const val = { name: label, Pemasukan: 0, Pengeluaran: 0 };
        if (t.type === 'income') {
          val.Pemasukan = t.amount;
        } else if (t.type === 'expense' || t.type === 'installment') {
          val.Pengeluaran = t.amount;
        }
        dataPoints[key] = val;
      }
    });

    return Object.keys(dataPoints)
      .sort()
      .map(key => dataPoints[key]);
  }, [filteredTransactions, reportPeriod]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Scope Selector */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Laporan Analisis Lanjut
            </h2>
            <CardDescription className="mt-0.5">Analisis visual mendalam arus kas keuangan Anda.</CardDescription>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              options={[
                { value: 'today', label: 'Hari Ini' },
                { value: 'week', label: '7 Hari Terakhir' },
                { value: 'month', label: `Bulan Ini (${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date())})` },
                { value: 'year', label: `Tahun Ini (${new Date().getFullYear()})` }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------------
          FINANCIAL SCORECARD RANGKUMAN
          --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Income Card */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">TOTAL MASUK</span>
            <h3 className="text-lg font-black text-success mt-1">{formatCurrency(totalIncome)}</h3>
            <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1.5 inline-block font-semibold">Semua Pemasukan</span>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">TOTAL KELUAR</span>
            <h3 className="text-lg font-black text-danger mt-1">{formatCurrency(totalExpense)}</h3>
            <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1.5 inline-block font-semibold">Rasio Belanja: {expenseRatio}%</span>
          </CardContent>
        </Card>

        {/* Savings Card */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">TOTAL TABUNGAN</span>
            <h3 className="text-lg font-black text-amber-500 mt-1">{formatCurrency(totalSavings)}</h3>
            <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1.5 inline-block font-semibold">Rasio Tabung: {savingsRatio}%</span>
          </CardContent>
        </Card>

        {/* Net Flow Card */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-text-mutedLight dark:text-text-mutedDark tracking-wide uppercase">SELISIH BERSIH (NET)</span>
            <h3 className={`text-lg font-black mt-1 ${netCashFlow >= 0 ? 'text-primary' : 'text-danger'}`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
            </h3>
            <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1.5 inline-block font-semibold">Sisa Arus Kas</span>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------------
          TREND & BUDGET PERFORMANCE CHARTS
          --------------------------------------------------------------------- */}
      <LazyViewport height="280px" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash flow trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Perbandingan Arus Kas
              </CardTitle>
              <CardDescription>Pemasukan vs pengeluaran dalam grafik visual</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {trendData.length === 0 ? (
                <p className="text-xs text-center text-text-mutedLight py-20">Tidak ada data tren pada periode ini.</p>
              ) : (
                <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                  <LazyCashFlowComparisonChart data={trendData} />
                </Suspense>
              )}
            </CardContent>
          </Card>

          {/* Budget Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-warning" />
                Realisasi Anggaran vs Limit (Bulan Ini)
              </CardTitle>
              <CardDescription>Mendeteksi kepatuhan batas belanja kategori</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {budgetPerformanceData.length === 0 ? (
                <p className="text-xs text-center text-text-mutedLight py-20">Belum ada data anggaran yang dibuat.</p>
              ) : (
                <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                  <LazyBudgetPerformanceChart data={budgetPerformanceData} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>
      </LazyViewport>

      {/* ---------------------------------------------------------------------
          DISTRIBUTIONS (INCOME VS EXPENSE)
          --------------------------------------------------------------------- */}
      <LazyViewport height="280px" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense distribution donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-danger" />
                Proporsi Pengeluaran
              </CardTitle>
              <CardDescription>Porsi belanja per kategori pilihan</CardDescription>
            </CardHeader>
            <CardContent className="h-70 flex flex-col sm:flex-row items-center gap-4">
              {expenseChartData.length === 0 ? (
                <p className="text-xs text-center text-text-mutedLight py-12 flex-1">Tidak ada data belanja.</p>
              ) : (
                <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                  <LazyExpensePropChart data={expenseChartData} totalExpense={totalExpense} />
                </Suspense>
              )}
            </CardContent>
          </Card>

          {/* Income distribution donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Proporsi Pendapatan
              </CardTitle>
              <CardDescription>Porsi pemasukan per kategori pilihan</CardDescription>
            </CardHeader>
            <CardContent className="h-70 flex flex-col sm:flex-row items-center gap-4">
              {incomeChartData.length === 0 ? (
                <p className="text-xs text-center text-text-mutedLight py-12 flex-1">Tidak ada data pemasukan.</p>
              ) : (
                <Suspense fallback={<div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />}>
                  <LazyIncomePropChart data={incomeChartData} totalIncome={totalIncome} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>
      </LazyViewport>

    </div>
  );
};
export default Reports;
