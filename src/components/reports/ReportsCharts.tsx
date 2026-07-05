import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

// Helper formatting currency
const formatCurrencyVal = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

// 1. CASH FLOW COMPARISON CHART
interface CashFlowComparisonChartProps {
  data: Array<{
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
  }>;
}

export const CashFlowComparisonChart: React.FC<CashFlowComparisonChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
  );
};

// 2. BUDGET PERFORMANCE CHART
interface BudgetPerformanceChartProps {
  data: Array<{
    name: string;
    'Limit Anggaran': number;
    'Terpakai': number;
  }>;
}

export const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
        <Bar dataKey="Limit Anggaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Terpakai" fill="#2563EB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 3. EXPENSE PROPORTION CHART
interface ExpensePropChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalExpense: number;
}

export const ExpensePropChart: React.FC<ExpensePropChartProps> = ({ data, totalExpense }) => {
  return (
    <>
      <div className="h-44 w-44 flex-shrink-0">
        <ResponsiveContainer width="100%" height={176} minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto flex-1 w-full text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-semibold">{item.name}</span>
            </div>
            <span className="font-bold">{formatCurrencyVal(item.value)} ({totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </>
  );
};

// 4. INCOME PROPORTION CHART
interface IncomePropChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalIncome: number;
}

export const IncomePropChart: React.FC<IncomePropChartProps> = ({ data, totalIncome }) => {
  return (
    <>
      <div className="h-44 w-44 flex-shrink-0">
        <ResponsiveContainer width="100%" height={176} minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto flex-1 w-full text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-semibold">{item.name}</span>
            </div>
            <span className="font-bold">{formatCurrencyVal(item.value)} ({totalIncome > 0 ? Math.round((item.value / totalIncome) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </>
  );
};
