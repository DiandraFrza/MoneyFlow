/** @format */

import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { LayoutGrid, PieChart as PieIcon, BarChart3, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// Helper formatting currency
const formatCurrencyVal = (amount: number): string => {
  return `Rp ${amount.toLocaleString("id-ID")}`;
};

// Custom tooltip for Donut Charts
interface CustomDonutTooltipProps {
  active?: boolean;
  payload?: any[];
  total: number;
}

const CustomDonutTooltip: React.FC<CustomDonutTooltipProps> = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return (
      <div className="bg-white px-3 py-2 rounded-lg border border-[#1e1e1e] shadow-md text-xs min-w-[140px] pointer-events-none z-50">
        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="font-bold text-[#1e1e1e] truncate">{item.name}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-black text-[#1e1e1e]">{formatCurrencyVal(item.value)}</span>
          <span className="font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#1e1e1e] border border-slate-200">
            {pct}%
          </span>
        </div>
      </div>
    );
  }
  return null;
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
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExp2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`]}
          contentStyle={{
            backgroundColor: "#FFFFFF",
            color: "#1e1e1e",
            borderRadius: "8px",
            border: "1px solid #1e1e1e",
            boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.12)",
            fontSize: "12px",
            fontWeight: 700,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold", color: "#1e1e1e" }} />
        <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc2)" />
        <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp2)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// 2. BUDGET PERFORMANCE CHART & CARDS
interface BudgetPerformanceChartProps {
  data: Array<{
    name: string;
    "Limit Anggaran": number;
    Terpakai: number;
  }>;
}

export const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<"chart" | "cards">("cards");

  return (
    <div className="w-full flex flex-col gap-3">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setViewMode("cards")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
            viewMode === "cards" ? "bg-[#1e1e1e] text-white shadow-xs" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kartu Kepatuhan
        </button>
        <button
          type="button"
          onClick={() => setViewMode("chart")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
            viewMode === "chart" ? "bg-[#1e1e1e] text-white shadow-xs" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Grafik Batang
        </button>
      </div>

      {viewMode === "chart" ? (
        <ResponsiveContainer width="100%" height={230} minWidth={0}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`]}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                color: "#1e1e1e",
                borderRadius: "8px",
                border: "1px solid #1e1e1e",
                boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.12)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold", color: "#1e1e1e" }} />
            <Bar dataKey="Limit Anggaran" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Terpakai" fill="#FF5722" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {data.map((item) => {
            const limit = item["Limit Anggaran"];
            const spent = item["Terpakai"];
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isOver = percent > 100;
            const isWarning = percent >= 75 && percent <= 100;

            return (
              <div
                key={item.name}
                className={cn(
                  "p-3 rounded-xl border transition-all flex flex-col gap-2 bg-white shadow-xs",
                  isOver ? "border-rose-300 bg-rose-50/30" : isWarning ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1e1e1e] truncate">{item.name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1",
                      isOver ? "bg-rose-100 text-rose-800" : isWarning ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    {isOver ? (
                      <>
                        <AlertCircle className="h-3 w-3" /> Over {percent}%
                      </>
                    ) : isWarning ? (
                      <>
                        <AlertTriangle className="h-3 w-3" /> Waspada {percent}%
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Aman {percent}%
                      </>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#555555]">
                  <span>
                    Terpakai: <strong className="text-[#1e1e1e]">{formatCurrencyVal(spent)}</strong>
                  </span>
                  <span>Limit: {formatCurrencyVal(limit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 3. EXPENSE PROPORTION CHART & SEGMENTED STRIP
interface ExpensePropChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalExpense: number;
}

export const ExpensePropChart: React.FC<ExpensePropChartProps> = ({ data, totalExpense }) => {
  const [viewMode, setViewMode] = useState<"cards" | "donut">("donut");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between pb-1">
        {/* Horizontal Segmented Bar (Strip) showing 100% distribution */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs h-2.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 shadow-inner">
          {data.map((item) => {
            const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
            return (
              <div
                key={item.name}
                title={`${item.name}: ${formatCurrencyVal(item.value)} (${Math.round(pct)}%)`}
                className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            title="Tampilan Kartu Proporsional"
            className={cn(
              "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
              viewMode === "cards" ? "bg-[#1e1e1e] text-white shadow-xs font-bold" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("donut")}
            title="Tampilan Donut Modern"
            className={cn(
              "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
              viewMode === "donut" ? "bg-[#1e1e1e] text-white shadow-xs font-bold" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
            )}
          >
            <PieIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "donut" ? (
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Donut graphic with center stat hub */}
          <div className="h-44 w-44 flex-shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={data.length > 1 ? 3 : 0}
                  dataKey="value"
                  stroke="#fafafa"
                  strokeWidth={2}
                  cornerRadius={3}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      style={{
                        transition: "opacity 0.2s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip total={totalExpense} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total Stat Hub - Ultra Clear & High Contrast */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#555555] truncate max-w-[105px]">
                {activeItem ? activeItem.name : "Total"}
              </span>
              <span className="text-xs sm:text-sm font-black text-[#1e1e1e] tracking-tight mt-0.5 leading-tight truncate max-w-[110px]">
                {formatCurrencyVal(activeItem ? activeItem.value : totalExpense)}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 bg-slate-100 text-[#1e1e1e] border border-slate-200">
                {activeItem
                  ? `${totalExpense > 0 ? Math.round((activeItem.value / totalExpense) * 100) : 0}%`
                  : `${data.length} Kategori`}
              </span>
            </div>
          </div>

          {/* Breakdown legend list */}
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto flex-1 w-full text-xs pr-1">
            {data.map((item, idx) => {
              const pct = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
              const isHovered = activeIndex === idx;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer select-none",
                    isHovered
                      ? "bg-white border-[#1e1e1e] shadow-xs translate-x-1"
                      : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="h-3 w-3 rounded-full flex-shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-xs text-[#1e1e1e] truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-xs text-[#1e1e1e]">
                      {formatCurrencyVal(item.value)}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-[#1e1e1e] border border-slate-200">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Modern Cards Matrix with Individual Proportion Indicators */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const pct = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
            return (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-2 hover:border-[#1e1e1e]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-xs text-[#1e1e1e] truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-[#1e1e1e] border border-slate-200">
                    {pct}%
                  </span>
                </div>

                {/* Sub-bar indicator */}
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#555555]">
                  <span>Porsi #{idx + 1}</span>
                  <span className="font-extrabold text-[#1e1e1e]">{formatCurrencyVal(item.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 4. INCOME PROPORTION CHART & SEGMENTED STRIP
interface IncomePropChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalIncome: number;
}

export const IncomePropChart: React.FC<IncomePropChartProps> = ({ data, totalIncome }) => {
  const [viewMode, setViewMode] = useState<"cards" | "donut">("donut");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between pb-1">
        {/* Horizontal Segmented Bar (Strip) */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs h-2.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 shadow-inner">
          {data.map((item) => {
            const pct = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
            return (
              <div
                key={item.name}
                title={`${item.name}: ${formatCurrencyVal(item.value)} (${Math.round(pct)}%)`}
                className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            title="Tampilan Kartu Proporsional"
            className={cn(
              "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
              viewMode === "cards" ? "bg-[#1e1e1e] text-white shadow-xs font-bold" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("donut")}
            title="Tampilan Donut Modern"
            className={cn(
              "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
              viewMode === "donut" ? "bg-[#1e1e1e] text-white shadow-xs font-bold" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-slate-200/60"
            )}
          >
            <PieIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "donut" ? (
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Donut graphic with center stat hub */}
          <div className="h-44 w-44 flex-shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={data.length > 1 ? 3 : 0}
                  dataKey="value"
                  stroke="#fafafa"
                  strokeWidth={2}
                  cornerRadius={3}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      style={{
                        transition: "opacity 0.2s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip total={totalIncome} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total Stat Hub - Ultra Clear & High Contrast */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#555555] truncate max-w-[105px]">
                {activeItem ? activeItem.name : "Total"}
              </span>
              <span className="text-xs sm:text-sm font-black text-[#1e1e1e] tracking-tight mt-0.5 leading-tight truncate max-w-[110px]">
                {formatCurrencyVal(activeItem ? activeItem.value : totalIncome)}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 bg-slate-100 text-[#1e1e1e] border border-slate-200">
                {activeItem
                  ? `${totalIncome > 0 ? Math.round((activeItem.value / totalIncome) * 100) : 0}%`
                  : `${data.length} Kategori`}
              </span>
            </div>
          </div>

          {/* Breakdown legend list */}
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto flex-1 w-full text-xs pr-1">
            {data.map((item, idx) => {
              const pct = totalIncome > 0 ? Math.round((item.value / totalIncome) * 100) : 0;
              const isHovered = activeIndex === idx;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer select-none",
                    isHovered
                      ? "bg-white border-[#1e1e1e] shadow-xs translate-x-1"
                      : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="h-3 w-3 rounded-full flex-shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-xs text-[#1e1e1e] truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-xs text-[#1e1e1e]">
                      {formatCurrencyVal(item.value)}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-[#1e1e1e] border border-slate-200">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Modern Cards Matrix with Individual Proportion Indicators */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const pct = totalIncome > 0 ? Math.round((item.value / totalIncome) * 100) : 0;
            return (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-2 hover:border-[#1e1e1e]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-xs text-[#1e1e1e] truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-[#1e1e1e] border border-slate-200">
                    {pct}%
                  </span>
                </div>

                {/* Sub-bar indicator */}
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#555555]">
                  <span>Porsi #{idx + 1}</span>
                  <span className="font-extrabold text-[#1e1e1e]">{formatCurrencyVal(item.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
