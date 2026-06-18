import { useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';

export interface FinancialHealth {
  score: number;
  status: 'Sehat' | 'Waspada' | 'Kritis';
  statusColor: string;
  savingsRatio: number; // percentage of savings from income
  expenseRatio: number; // percentage of expenses from income
  budgetCompliance: number; // percentage of categories under budget
  debtRatio: number; // debt compared to income
  tips: string[];
}

export const useFinancialHealth = (): FinancialHealth => {
  const { transactions, wallets, budgets, debts, categories } = useFinanceStore();
  const { user } = useAuthStore();
  
  return useMemo(() => {
    const salary = user?.monthly_salary || 0;
    
    // 1. Calculate Monthly Income & Expense (for current month: June 2026)
    const currentMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      return txDate.getMonth() === 5 && txDate.getFullYear() === 2026; // June is month index 5
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || salary || 1; // avoid division by 0

    const monthlyExpense = currentMonthTransactions
      .filter(t => t.type === 'expense' || t.type === 'installment')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = currentMonthTransactions
      .filter(t => t.type === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Ratios
    const savingsRatio = Math.round((monthlySavings / monthlyIncome) * 100);
    const expenseRatio = Math.round((monthlyExpense / monthlyIncome) * 100);

    // 3. Debt Ratio
    const totalPendingDebt = debts
      .filter(d => d.type === 'borrowed' && d.status === 'pending')
      .reduce((sum, d) => sum + d.remaining_amount, 0);
    const debtRatio = Math.round((totalPendingDebt / (salary || 1)) * 100);

    // 4. Budget Compliance
    // Calculate spent per category in June 2026
    const spentByCategory: Record<string, number> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category_id)
      .forEach(t => {
        spentByCategory[t.category_id!] = (spentByCategory[t.category_id!] || 0) + t.amount;
      });

    // Active budgets for June 2026
    const currentBudgets = budgets.filter(b => b.month === 6 && b.year === 2026);
    let budgetCompliance = 100;
    
    if (currentBudgets.length > 0) {
      let compliantCategories = 0;
      currentBudgets.forEach(b => {
        const spent = spentByCategory[b.category_id] || 0;
        if (spent <= b.amount) {
          compliantCategories++;
        }
      });
      budgetCompliance = Math.round((compliantCategories / currentBudgets.length) * 100);
    }

    // 5. CALCULATE SCORE (0-100)
    let score = 100;
    
    // A. Expense Ratio Factor (30% weight)
    // Target: <= 50% of income is ideal.
    let expenseScore = 100;
    if (expenseRatio > 50) {
      expenseScore = Math.max(0, 100 - (expenseRatio - 50) * 2);
    }
    score -= (100 - expenseScore) * 0.3;

    // B. Savings Ratio Factor (25% weight)
    // Target: >= 20% of income is ideal.
    let savingsScore = 0;
    if (savingsRatio >= 20) {
      savingsScore = 100;
    } else {
      savingsScore = (savingsRatio / 20) * 100;
    }
    score -= (100 - savingsScore) * 0.25;

    // C. Budget Compliance (25% weight)
    // Target: 100% compliant.
    score -= (100 - budgetCompliance) * 0.25;

    // D. Debt Ratio Factor (20% weight)
    // Target: <= 30% of monthly salary.
    let debtScore = 100;
    if (debtRatio > 30) {
      debtScore = Math.max(0, 100 - (debtRatio - 30) * 1.5);
    }
    score -= (100 - debtScore) * 0.2;

    // Keep score bounded between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine status
    let status: 'Sehat' | 'Waspada' | 'Kritis' = 'Sehat';
    let statusColor = 'text-success';
    if (score < 50) {
      status = 'Kritis';
      statusColor = 'text-danger';
    } else if (score < 80) {
      status = 'Waspada';
      statusColor = 'text-warning';
    }

    // 6. DYNAMIC TIPS (Indonesian)
    const tips: string[] = [];
    if (expenseRatio > 60) {
      tips.push('Pengeluaran Anda melebihi 60% pendapatan. Coba tinjau kategori non-primer seperti hiburan atau belanja online.');
    }
    if (savingsRatio < 10) {
      tips.push('Porsi tabungan Anda masih di bawah 10%. Usahakan menyisihkan tabungan di awal bulan sebelum mulai belanja (pay yourself first).');
    }
    if (budgetCompliance < 75) {
      tips.push('Anda melanggar beberapa anggaran kategori belanja. Coba aktifkan notifikasi limit anggaran untuk kontrol ketat.');
    }
    if (debtRatio > 30) {
      tips.push(`Total utang aktif Anda mencapai ${debtRatio}% dari gaji. Prioritaskan pelunasan utang dengan bunga tertinggi terlebih dahulu.`);
    }
    if (score >= 85) {
      tips.push('Luar biasa! Pengelolaan keuangan Anda sangat sehat. Pertahankan kebiasaan baik ini dan pertimbangkan meningkatkan investasi.');
    } else if (tips.length === 0) {
      tips.push('Keuangan Anda stabil. Cobalah membuat target tabungan baru untuk memotivasi investasi jangka panjang.');
    }

    return {
      score,
      status,
      statusColor,
      savingsRatio,
      expenseRatio,
      budgetCompliance,
      debtRatio,
      tips
    };
  }, [transactions, wallets, budgets, debts, categories, user]);
};
