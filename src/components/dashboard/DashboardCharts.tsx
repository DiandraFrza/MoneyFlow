import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface CashFlowTrendChartProps {
  data: Array<{
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
  }>;
}

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
        <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`]} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: "bold" }} />
        <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
        <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface CategoryDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalExpense: number;
  formatCurrency: (amount: number) => string;
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  data,
  totalExpense,
  formatCurrency,
}) => {
  return (
    <>
      <div className="h-48 w-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom scrollable legend */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto flex-1 w-full text-xs">
        {data.map((item) => {
          const percent = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-text-light dark:text-text-dark">{item.name}</span>
              </div>
              <span className="font-extrabold text-text-mutedLight dark:text-text-mutedDark">
                {percent}% ({formatCurrency(item.value)})
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};
