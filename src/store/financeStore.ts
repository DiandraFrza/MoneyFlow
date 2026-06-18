import { create } from 'zustand';
import { db, runRecurringEngine, ensureDatabaseSeeded } from '../lib/repository';
import type { 
  Wallet, Transaction, WalletTransfer, Budget, SavingsGoal, 
  Debt, RecurringTransaction, AppNotification, Category, SubCategory 
} from '../types';

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
  
  // Actions
  fetchData: (userId: string) => Promise<void>;
  
  // Wallet actions
  addWallet: (userId: string, wallet: Omit<Wallet, 'id' | 'user_id'>) => Promise<void>;
  updateWallet: (userId: string, id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (userId: string, id: string) => Promise<void>;
  
  // Category actions
  addCategory: (userId: string, category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;
  
  // Transaction actions
  addTransaction: (userId: string, tx: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  updateTransaction: (userId: string, id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (userId: string, id: string) => Promise<void>;
  
  // Transfer actions
  addTransfer: (userId: string, tf: Omit<WalletTransfer, 'id' | 'user_id'>) => Promise<void>;
  
  // Budget actions
  setBudget: (userId: string, budget: Omit<Budget, 'id' | 'user_id'>) => Promise<void>;
  
  // Savings actions
  addSavingsGoal: (userId: string, goal: Omit<SavingsGoal, 'id' | 'user_id'>) => Promise<void>;
  updateSavingsGoal: (userId: string, id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (userId: string, id: string) => Promise<void>;
  
  // Debt actions
  addDebt: (userId: string, debt: Omit<Debt, 'id' | 'user_id' | 'status'>) => Promise<void>;
  updateDebt: (userId: string, id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (userId: string, id: string) => Promise<void>;
  
  // Recurring actions
  addRecurring: (userId: string, rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'status'>) => Promise<void>;
  updateRecurring: (userId: string, id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (userId: string, id: string) => Promise<void>;
  
  // Notification actions
  addNotification: (userId: string, notif: Omit<AppNotification, 'id' | 'user_id' | 'is_read' | 'created_at'>) => Promise<void>;
  readNotification: (userId: string, id: string) => Promise<void>;
  readAllNotifications: (userId: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
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

  fetchData: async (userId: string) => {
    set({ loading: true });
    try {
      // 1. Ensure database is seeded (creates default wallets, categories, subcategories)
      await ensureDatabaseSeeded(userId);

      // 2. Run recurring engine check first
      await runRecurringEngine(userId);
      
      // 2. Fetch all data in parallel
      const [
        wallets, transactions, transfers, budgets, 
        savings, debts, recurring, notifications, 
        categories, subcategories
      ] = await Promise.all([
        db.wallets.list(userId),
        db.transactions.list(userId),
        db.transfers.list(userId),
        db.budgets.list(userId),
        db.savings.list(userId),
        db.debts.list(userId),
        db.recurring.list(userId),
        db.notifications.list(userId),
        db.categories.list(userId),
        db.categories.subcategories.list()
      ]);

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
        loading: false
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
      set({ loading: false });
    }
  },

  addWallet: async (userId, wallet) => {
    await db.wallets.create(userId, wallet);
    const wallets = await db.wallets.list(userId);
    set({ wallets });
  },

  updateWallet: async (userId, id, updates) => {
    await db.wallets.update(userId, id, updates);
    const wallets = await db.wallets.list(userId);
    set({ wallets });
  },

  deleteWallet: async (userId, id) => {
    await db.wallets.delete(userId, id);
    const wallets = await db.wallets.list(userId);
    set({ wallets });
  },

  addCategory: async (userId, category) => {
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
    await db.transactions.create(userId, tx);
    
    // Refresh all related data as transactional flows adjust wallet balance, savings goals, debts, etc.
    const [transactions, wallets, savings, debts] = await Promise.all([
      db.transactions.list(userId),
      db.wallets.list(userId),
      db.savings.list(userId),
      db.debts.list(userId)
    ]);
    
    set({ transactions, wallets, savings, debts });
  },

  updateTransaction: async (userId, id, updates) => {
    await db.transactions.update(userId, id, updates);
    
    const [transactions, wallets] = await Promise.all([
      db.transactions.list(userId),
      db.wallets.list(userId)
    ]);
    
    set({ transactions, wallets });
  },

  deleteTransaction: async (userId, id) => {
    await db.transactions.delete(userId, id);
    
    const [transactions, wallets] = await Promise.all([
      db.transactions.list(userId),
      db.wallets.list(userId)
    ]);
    
    set({ transactions, wallets });
  },

  addTransfer: async (userId, tf) => {
    await db.transfers.create(userId, tf);
    
    const [transfers, wallets] = await Promise.all([
      db.transfers.list(userId),
      db.wallets.list(userId)
    ]);
    
    set({ transfers, wallets });
  },

  setBudget: async (userId, budget) => {
    await db.budgets.upsert(userId, budget);
    const budgets = await db.budgets.list(userId);
    set({ budgets });
  },

  addSavingsGoal: async (userId, goal) => {
    await db.savings.create(userId, goal);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  updateSavingsGoal: async (userId, id, updates) => {
    await db.savings.update(userId, id, updates);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  deleteSavingsGoal: async (userId, id) => {
    await db.savings.delete(userId, id);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  addDebt: async (userId, debt) => {
    await db.debts.create(userId, debt);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  updateDebt: async (userId, id, updates) => {
    await db.debts.update(userId, id, updates);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  deleteDebt: async (userId, id) => {
    await db.debts.delete(userId, id);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  addRecurring: async (userId, rec) => {
    await db.recurring.create(userId, rec);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  updateRecurring: async (userId, id, updates) => {
    await db.recurring.update(userId, id, updates);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  deleteRecurring: async (userId, id) => {
    await db.recurring.delete(userId, id);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  addNotification: async (userId, notif) => {
    await db.notifications.create(userId, notif);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  readNotification: async (userId, id) => {
    await db.notifications.markAsRead(userId, id);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  readAllNotifications: async (userId) => {
    await db.notifications.markAllAsRead(userId);
    const notifications = await db.notifications.list(userId);
    set({ notifications });
  },

  clearNotifications: async (userId) => {
    await db.notifications.clear(userId);
    set({ notifications: [] });
  }
}));
