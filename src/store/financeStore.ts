/** @format */

import { create } from "zustand";
import { db, runRecurringEngine, ensureDatabaseSeeded } from "../lib/repository";
import type { Wallet, Transaction, WalletTransfer, Budget, SavingsGoal, Debt, RecurringTransaction, AppNotification, Category, SubCategory } from "../types";

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  budgets: Budget[];
  savings: SavingsGoal[];
  debts: Debt[];
  recurring: RecurringTransaction[];
  notifications: AppNotification[];
  categories: Category[];
  subcategories: SubCategory[];
  loading: boolean;
  lastFetchedUserId: string | null;

  // Actions
  fetchData: (userId: string) => Promise<void>;

  // Wallet actions
  addWallet: (userId: string, wallet: Omit<Wallet, "id" | "user_id">) => Promise<void>;
  updateWallet: (userId: string, id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (userId: string, id: string) => Promise<void>;

  // Category actions
  addCategory: (userId: string, category: Omit<Category, "id" | "user_id">) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;

  // Transaction actions
  addTransaction: (userId: string, tx: Omit<Transaction, "id" | "user_id">) => Promise<void>;
  updateTransaction: (userId: string, id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (userId: string, id: string) => Promise<void>;

  // Transfer actions
  addTransfer: (userId: string, tf: Omit<WalletTransfer, "id" | "user_id">) => Promise<void>;

  // Budget actions
  setBudget: (userId: string, budget: Omit<Budget, "id" | "user_id">) => Promise<void>;
  deleteBudget: (userId: string, id: string) => Promise<void>;

  // Savings actions
  addSavingsGoal: (userId: string, goal: Omit<SavingsGoal, "id" | "user_id">) => Promise<void>;
  updateSavingsGoal: (userId: string, id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (userId: string, id: string) => Promise<void>;

  // Debt actions
  addDebt: (userId: string, debt: Omit<Debt, "id" | "user_id" | "status">) => Promise<void>;
  updateDebt: (userId: string, id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (userId: string, id: string) => Promise<void>;

  // Recurring actions
  addRecurring: (userId: string, rec: Omit<RecurringTransaction, "id" | "user_id" | "status">) => Promise<void>;
  updateRecurring: (userId: string, id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (userId: string, id: string) => Promise<void>;

  // Notification actions
  addNotification: (userId: string, notif: Omit<AppNotification, "id" | "user_id" | "is_read" | "created_at">) => Promise<void>;
  readNotification: (userId: string, id: string) => Promise<void>;
  readAllNotifications: (userId: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  wallets: [],
  transactions: [],
  transfers: [],
  budgets: [],
  savings: [],
  debts: [],
  recurring: [],
  notifications: [],
  categories: [],
  subcategories: [],
  loading: false,
  lastFetchedUserId: null,

  fetchData: async (userId: string) => {
    if (!userId) {
      console.warn("[Finance] fetchData dipanggil tanpa userId, diabaikan");
      return;
    }

    console.log("[Finance] fetchData mulai, userId:", userId);
    set({ loading: true });
    
    try {
      // 1. Ensure database is seeded (creates default wallets, categories, subcategories)
      await ensureDatabaseSeeded(userId);

      // 2. Run recurring engine check
      await runRecurringEngine(userId);

      // 3. Fetch all data in parallel
      console.log("[Finance] Mengambil semua data dari database...");
      const [wallets, transactions, transfers, budgets, savings, debts, recurring, notifications, categories, subcategories] = await Promise.all([
        db.wallets.list(userId),
        db.transactions.list(userId),
        db.transfers.list(userId),
        db.budgets.list(userId),
        db.savings.list(userId),
        db.debts.list(userId),
        db.recurring.list(userId),
        db.notifications.list(userId),
        db.categories.list(userId),
        db.categories.subcategories.list(),
      ]);

      console.log("[Finance] ✅ Data berhasil diambil:", {
        wallets: wallets.length,
        transactions: transactions.length,
        categories: categories.length,
        subcategories: subcategories.length,
      });

      set({
        wallets,
        transactions,
        transfers,
        budgets,
        savings,
        debts,
        recurring,
        notifications,
        categories,
        subcategories,
        loading: false,
        lastFetchedUserId: userId,
      });
    } catch (err) {
      console.error("[Finance] ❌ Error fetchData:", err);
      set({ loading: false });
    }
  },

  addWallet: async (userId, wallet) => {
    if (!userId) { console.error("[Finance] addWallet: userId tidak ada"); return; }
    console.log("[Finance] addWallet, userId:", userId, "wallet:", wallet);
    try {
      await db.wallets.create(userId, wallet);
      const wallets = await db.wallets.list(userId);
      set({ wallets });
      console.log("[Finance] ✅ Wallet berhasil ditambahkan");
    } catch (err: any) {
      console.error("[Finance] ❌ addWallet error:", err.message);
      throw err;
    }
  },

  updateWallet: async (userId, id, updates) => {
    if (!userId) { console.error("[Finance] updateWallet: userId tidak ada"); return; }
    try {
      await db.wallets.update(userId, id, updates);
      const wallets = await db.wallets.list(userId);
      set({ wallets });
    } catch (err: any) {
      console.error("[Finance] ❌ updateWallet error:", err.message);
      throw err;
    }
  },

  deleteWallet: async (userId, id) => {
    if (!userId) { console.error("[Finance] deleteWallet: userId tidak ada"); return; }
    try {
      await db.wallets.delete(userId, id);
      const wallets = await db.wallets.list(userId);
      set({ wallets });
    } catch (err: any) {
      console.error("[Finance] ❌ deleteWallet error:", err.message);
      throw err;
    }
  },

  addCategory: async (userId, category) => {
    if (!userId) return;
    await db.categories.create(userId, category);
    const categories = await db.categories.list(userId);
    set({ categories });
  },

  addSubcategory: async (categoryId, name) => {
    await db.categories.subcategories.create(categoryId, name);
    const subcategories = await db.categories.subcategories.list();
    set({ subcategories });
  },

  addTransaction: async (userId, tx) => {
    if (!userId) { console.error("[Finance] addTransaction: userId tidak ada"); return; }
    console.log("[Finance] addTransaction, userId:", userId, "tx:", tx);
    try {
      await db.transactions.create(userId, tx);
      
      // Refresh semua data yang mungkin berubah
      const [transactions, wallets, savings, debts] = await Promise.all([
        db.transactions.list(userId),
        db.wallets.list(userId),
        db.savings.list(userId),
        db.debts.list(userId),
      ]);

      set({ transactions, wallets, savings, debts });
      console.log("[Finance] ✅ Transaksi berhasil disimpan");
    } catch (err: any) {
      console.error("[Finance] ❌ addTransaction error:", err.message);
      throw err;
    }
  },

  updateTransaction: async (userId, id, updates) => {
    if (!userId) return;
    try {
      await db.transactions.update(userId, id, updates);
      const [transactions, wallets] = await Promise.all([
        db.transactions.list(userId),
        db.wallets.list(userId),
      ]);
      set({ transactions, wallets });
    } catch (err: any) {
      console.error("[Finance] ❌ updateTransaction error:", err.message);
      throw err;
    }
  },

  deleteTransaction: async (userId, id) => {
    if (!userId) return;
    try {
      await db.transactions.delete(userId, id);
      const [transactions, wallets] = await Promise.all([
        db.transactions.list(userId),
        db.wallets.list(userId),
      ]);
      set({ transactions, wallets });
    } catch (err: any) {
      console.error("[Finance] ❌ deleteTransaction error:", err.message);
      throw err;
    }
  },

  addTransfer: async (userId, tf) => {
    if (!userId) return;
    try {
      await db.transfers.create(userId, tf);
      const [transfers, wallets] = await Promise.all([
        db.transfers.list(userId),
        db.wallets.list(userId),
      ]);
      set({ transfers, wallets });
    } catch (err: any) {
      console.error("[Finance] ❌ addTransfer error:", err.message);
      throw err;
    }
  },

  setBudget: async (userId, budget) => {
    if (!userId) return;
    await db.budgets.upsert(userId, budget);
    const budgets = await db.budgets.list(userId);
    set({ budgets });
  },

  deleteBudget: async (userId, id) => {
    if (!userId) return;
    await db.budgets.delete(userId, id);
    const budgets = await db.budgets.list(userId);
    set({ budgets });
  },

  addSavingsGoal: async (userId, goal) => {
    if (!userId) return;
    await db.savings.create(userId, goal);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  updateSavingsGoal: async (userId, id, updates) => {
    if (!userId) return;
    await db.savings.update(userId, id, updates);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  deleteSavingsGoal: async (userId, id) => {
    if (!userId) return;
    await db.savings.delete(userId, id);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  addDebt: async (userId, debt) => {
    if (!userId) return;
    await db.debts.create(userId, debt);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  updateDebt: async (userId, id, updates) => {
    if (!userId) return;
    await db.debts.update(userId, id, updates);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  deleteDebt: async (userId, id) => {
    if (!userId) return;
    await db.debts.delete(userId, id);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  addRecurring: async (userId, rec) => {
    if (!userId) return;
    await db.recurring.create(userId, rec);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  updateRecurring: async (userId, id, updates) => {
    if (!userId) return;
    await db.recurring.update(userId, id, updates);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  deleteRecurring: async (userId, id) => {
    if (!userId) return;
    await db.recurring.delete(userId, id);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  addNotification: async (userId, notif) => {
    if (!userId) return;
    await db.notifications.create(userId, notif);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  readNotification: async (userId, id) => {
    if (!userId) return;
    await db.notifications.markAsRead(userId, id);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  readAllNotifications: async (userId) => {
    if (!userId) return;
    await db.notifications.markAllAsRead(userId);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  clearNotifications: async (userId) => {
    if (!userId) return;
    await db.notifications.clear(userId);
    set({ notifications: [] });
  },
}));
