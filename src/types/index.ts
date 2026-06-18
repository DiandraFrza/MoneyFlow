/** @format */

// TypeScript Types for MoneyFlow Pro

export interface UserProfile {
  id: string;
  name: string;
  photo_url?: string;
  currency: string;
  monthly_salary: number;
  financial_target: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "light" | "dark";
  notifications_enabled: boolean;
  low_balance_threshold: number;
  created_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: "cash" | "bank" | "e-wallet" | "crypto" | "other";
  provider?: string; // optional provider/bank/e-wallet name (e.g. BCA, Mandiri, GoPay)
  description?: string; // optional notes for the wallet
  balance: number;
  icon: string; // lucide icon name
  color: string; // hex color
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string | null; // Null means it's a system default category
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  created_at?: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  created_at?: string;
}

export type TransactionType = "income" | "expense" | "savings" | "debt_payment" | "installment";

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  sub_category_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string; // YYYY-MM-DD
  receipt_url?: string;
  created_at?: string;
}

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  description?: string;
  date: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number; // 1-12
  year: number;
  created_at?: string;
}

export interface BudgetLog {
  id: string;
  budget_id: string;
  user_id: string;
  spent: number;
  month: number;
  year: number;
  updated_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  type: "borrowed" | "lent";
  person_name: string;
  amount: number;
  remaining_amount: number;
  due_date?: string; // YYYY-MM-DD
  status: "pending" | "paid";
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  sub_category_id?: string | null;
  type: "income" | "expense";
  amount: number;
  description?: string;
  frequency: "weekly" | "monthly" | "yearly";
  interval_day: number; // e.g. day of month or day of week
  last_generated?: string;
  next_date: string;
  status: "active" | "paused";
  created_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "budget" | "bill" | "savings" | "debt" | "system";
  is_read: boolean;
  created_at?: string;
}

export interface FinancialHealthLog {
  id: string;
  user_id: string;
  score: number;
  savings_ratio: number;
  expense_ratio: number;
  debt_ratio: number;
  budget_compliance: number;
  log_date: string;
  created_at?: string;
}
