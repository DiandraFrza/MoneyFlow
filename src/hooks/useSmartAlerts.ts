/** @format */

import { useMemo, useEffect, useRef } from "react";
import { useFinanceStore } from "../store/financeStore";
import { useAuthStore } from "../store/authStore";

export interface SmartAlert {
  id: string;
  type: "budget" | "bill" | "savings" | "debt" | "system";
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
}

export const useSmartAlerts = (): SmartAlert[] => {
  const { wallets, transactions, budgets, recurring, debts, notifications, addNotification } = useFinanceStore();
  const { user } = useAuthStore();
  const isAddingNotif = useRef<Record<string, boolean>>({});

  const alerts = useMemo(() => {
    const activeAlerts: SmartAlert[] = [];
    // -------------------------------------------------------------------------
    // 1. Check Low Balance (< Rp500.000)
    // -------------------------------------------------------------------------
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    if (totalBalance < 500000) {
      activeAlerts.push({
        id: "alert-low-balance",
        type: "system",
        title: "Saldo Kritis",
        message: `Total saldo tersisa di bawah Rp500.000 (Saat ini: Rp${totalBalance.toLocaleString("id-ID")}).`,
        severity: "danger",
      });
    }

    // -------------------------------------------------------------------------
    // 2. Check Low Balance vs Income (<= 20% of monthly income)
    // -------------------------------------------------------------------------
    const currentMonthTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date + "T12:00:00");
      return txDate.getMonth() === 5 && txDate.getFullYear() === 2026; // June 2026
    });

    const monthlyIncome = currentMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0) || user?.monthly_salary || 0;

    if (monthlyIncome > 0 && totalBalance <= monthlyIncome * 0.2) {
      activeAlerts.push({
        id: "alert-low-ratio",
        type: "system",
        title: "Risiko Sisa Keuangan",
        message: `Sisa uang Anda <= 20% dari total pemasukan bulan ini (${Math.round((totalBalance / monthlyIncome) * 100)}% tersisa).`,
        severity: "warning",
      });
    }

    // -------------------------------------------------------------------------
    // 3. Check Overspending Today (> 50% compared to 7-day average)
    // -------------------------------------------------------------------------
    // Today's total spending (2026-06-18)
    const todayStr = "2026-06-18";
    const todayExpenses = transactions.filter((t) => t.date === todayStr && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);

    // Calculate past 7 days spending (excluding today)
    let totalPast7Days = 0;
    for (let i = 1; i <= 7; i++) {
      const d = new Date("2026-06-18T12:00:00");
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayExpense = transactions.filter((t) => t.date === dateStr && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);
      totalPast7Days += dayExpense;
    }
    const avgPast7Days = totalPast7Days / 7;

    if (avgPast7Days > 0 && todayExpenses > avgPast7Days * 1.5) {
      activeAlerts.push({
        id: `alert-overspending-${todayStr}`,
        type: "system",
        title: "Lonjakan Pengeluaran Harian",
        message: `Belanja hari ini (Rp${todayExpenses.toLocaleString("id-ID")}) naik >50% dari rata-rata 7 hari terakhir (Rp${Math.round(avgPast7Days).toLocaleString("id-ID")}).`,
        severity: "warning",
      });
    }

    // -------------------------------------------------------------------------
    // 4. Budget Exceeded
    // -------------------------------------------------------------------------
    const spentByCategory: Record<string, number> = {};
    currentMonthTransactions
      .filter((t) => (t.type === "expense" || t.type === "installment") && t.category_id)
      .forEach((t) => {
        spentByCategory[t.category_id!] = (spentByCategory[t.category_id!] || 0) + t.amount;
      });

    const currentBudgets = budgets.filter((b) => b.month === 6 && b.year === 2026);
    currentBudgets.forEach((b) => {
      const spent = spentByCategory[b.category_id] || 0;
      if (spent > b.amount) {
        activeAlerts.push({
          id: `alert-budget-exceeded-${b.category_id}`,
          type: "budget",
          title: "Anggaran Jebol",
          message: `Anggaran bulanan terlampaui untuk kategori pengeluaran ini.`,
          severity: "danger",
        });
      }
    });

    // -------------------------------------------------------------------------
    // 5. Bills Due within 3 days (Recurring / Debts)
    // -------------------------------------------------------------------------
    const todayTime = new Date("2026-06-18T12:00:00").getTime();
    const threeDaysFromNow = todayTime + 3 * 24 * 60 * 60 * 1000;

    // Check active recurring templates
    recurring
      .filter((r) => r.status === "active" && r.type === "expense")
      .forEach((r) => {
        const nextTime = new Date(r.next_date + "T12:00:00").getTime();
        if (nextTime >= todayTime && nextTime <= threeDaysFromNow) {
          activeAlerts.push({
            id: `alert-recurring-due-${r.id}-${r.next_date}`,
            type: "bill",
            title: "Tagihan Berulang Mendatang ⏰",
            message: `Tagihan '${r.description}' sebesar Rp${r.amount.toLocaleString("id-ID")} jatuh tempo pada ${r.next_date}.`,
            severity: "info",
          });
        }
      });

    // Check pending borrowed debts
    debts
      .filter((d) => d.type === "borrowed" && d.status === "pending" && d.due_date)
      .forEach((d) => {
        const dueTime = new Date(d.due_date! + "T12:00:00").getTime();
        if (dueTime >= todayTime && dueTime <= threeDaysFromNow) {
          activeAlerts.push({
            id: `alert-debt-due-${d.id}`,
            type: "debt",
            title: "Pinjaman Jatuh Tempo",
            message: `Utang Anda ke ${d.person_name} sebesar Rp${d.remaining_amount.toLocaleString("id-ID")} jatuh tempo pada ${d.due_date}.`,
            severity: "warning",
          });
        }
      });

    return activeAlerts;
  }, [wallets, transactions, budgets, recurring, debts, user]);

  // Push new alerts as persistent notifications in the background
  useEffect(() => {
    const userId = user?.id || "local-user";

    alerts.forEach((alert) => {
      // Avoid duplicate trigger within current page load session
      if (isAddingNotif.current[alert.id]) return;

      // Check if notification already exists in store
      const exists = notifications.some((n) => n.title === alert.title && n.message === alert.message);

      if (!exists) {
        isAddingNotif.current[alert.id] = true;
        // Run async create notification
        addNotification(userId, {
          title: alert.title,
          message: alert.message,
          type: alert.type,
        })
          .catch((err: any) => {
            console.error("Failed to create automatic alert notification:", err);
          })
          .finally(() => {
            isAddingNotif.current[alert.id] = false;
          });
      }
    });
  }, [alerts, notifications, addNotification, user]);

  return alerts;
};
