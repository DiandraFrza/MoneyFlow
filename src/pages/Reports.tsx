import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select } from '../components/ui/select';

import { 
  TrendingUp, TrendingDown, Scale, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

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
    
    filteredTransactions.forEach(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      let key = t.date;
      let label = txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      if (reportPeriod === 'year') {
        key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
        label = txDate.toLocaleDateString('id-ID', { month: 'long' });
      }

      if (!dataPoints[key]) {
        dataPoints[key] = { name: label, Pemasukan: 0, Pengeluaran: 0 };
      }

      if (t.type === 'income') {
        dataPoints[key].Pemasukan += t.amount;
      } else if (t.type === 'expense' || t.type === 'installment') {
        dataPoints[key].Pengeluaran += t.amount;
      }
    });

    return Object.values(dataPoints).sort(() => 1);
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
                { value: 'month', label: 'Bulan Ini (Juni)' },
                { value: 'year', label: 'Tahun Ini (2026)' }
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorInc2)" />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorExp2)" />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Bar dataKey="Limit Anggaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Terpakai" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------------
          DISTRIBUTIONS (INCOME VS EXPENSE)
          --------------------------------------------------------------------- */}
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
              <>
                <div className="h-44 w-44 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto flex-1 w-full text-xs">
                  {expenseChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(item.value)} ({Math.round((item.value / totalExpense) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
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
              <>
                <div className="h-44 w-44 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {incomeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto flex-1 w-full text-xs">
                  {incomeChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(item.value)} ({Math.round((item.value / totalIncome) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
export default Reports;
