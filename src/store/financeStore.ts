/** @format */

import { create } from "zustand";
import { db, runRecurringEngine, ensureDatabaseSeeded } from "../lib/repository";
import { useActorStore } from "./actorStore";
import { useAuthStore } from "./authStore";
import type { Wallet, Transaction, WalletTransfer, Budget, SavingsGoal, Debt, RecurringTransaction, AppNotification, Category, SubCategory } from "../types";

const assertNotViewer = (actionName: string) => {
  const auth = useAuthStore.getState();
  if (auth.activeRole === "viewer") {
    throw new Error(`Akses ditolak: Peran 'viewer' hanya memiliki akses melihat data (read-only). Tidak dapat ${actionName}.`);
  }
};

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
  updateCategory: (userId: string, id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (userId: string, id: string) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;
  updateSubcategory: (id: string, name: string) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;

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

      console.log("[Finance] Data berhasil dimuat:", {
        wallets: wallets.length,
        transactions: transactions.length,
        budgets: budgets.length,
        savings: savings.length,
        debts: debts.length,
        recurring: recurring.length,
        notifications: notifications.length,
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
    } catch (err: any) {
      console.error("[Finance] ❌ fetchData error:", err.message);
      set({ loading: false });
    }
  },

  addWallet: async (userId, wallet) => {
    if (!userId) { console.error("[Finance] addWallet: userId tidak ada"); return; }
    assertNotViewer("menambah dompet");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    const auth = useAuthStore.getState();
    const enrichedWallet: Omit<Wallet, "id" | "user_id"> = {
      ...wallet,
      workspace_id: wallet.workspace_id || auth.activeWorkspaceId || undefined,
      is_private: wallet.is_private ?? false,
    };

    console.log("[Finance] addWallet, targetUserId:", targetUserId, "wallet:", enrichedWallet);
    try {
      await db.wallets.create(targetUserId, enrichedWallet);
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
    assertNotViewer("mengubah dompet");
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
    assertNotViewer("menghapus dompet");
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
    assertNotViewer("menambah kategori");
    await db.categories.create(userId, category);
    const categories = await db.categories.list(userId);
    set({ categories });
  },

  updateCategory: async (userId, id, updates) => {
    if (!userId) return;
    assertNotViewer("mengubah kategori");
    await db.categories.update(userId, id, updates);
    const categories = await db.categories.list(userId);
    set({ categories });
  },

  deleteCategory: async (userId, id) => {
    if (!userId) return;
    assertNotViewer("menghapus kategori");
    await db.categories.delete(userId, id);
    const [categories, subcategories] = await Promise.all([
      db.categories.list(userId),
      db.categories.subcategories.list(),
    ]);
    set({ categories, subcategories });
  },

  addSubcategory: async (categoryId, name) => {
    assertNotViewer("menambah subkategori");
    const userId = get().lastFetchedUserId || "local-user";
    const newSub = await db.categories.subcategories.create(categoryId, name, userId);
    const subcategories = await db.categories.subcategories.list(userId);
    if (!subcategories.some((s) => s.id === newSub.id)) {
      subcategories.push(newSub);
    }
    set({ subcategories });
  },

  updateSubcategory: async (id, name) => {
    assertNotViewer("mengubah subkategori");
    const userId = get().lastFetchedUserId || "local-user";
    await db.categories.subcategories.update(id, name);
    const subcategories = await db.categories.subcategories.list(userId);
    set({ subcategories });
  },

  deleteSubcategory: async (id) => {
    assertNotViewer("menghapus subkategori");
    const userId = get().lastFetchedUserId || "local-user";
    await db.categories.subcategories.delete(id);
    const subcategories = await db.categories.subcategories.list(userId);
    set({ subcategories });
  },

  addTransaction: async (userId, tx) => {
    if (!userId) { console.error("[Finance] addTransaction: userId tidak ada"); return; }
    assertNotViewer("menambah transaksi");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    const auth = useAuthStore.getState();
    const currentUser = auth.user;
    const enrichedTx: Omit<Transaction, "id" | "user_id"> = {
      ...tx,
      workspace_id: tx.workspace_id || auth.activeWorkspaceId || undefined,
      created_by_id: tx.created_by_id || currentUser?.id || targetUserId,
      created_by_name: tx.created_by_name || currentUser?.name || "Pengguna",
    };

    console.log("[Finance] addTransaction, targetUserId:", targetUserId, "tx:", enrichedTx);
    try {
      await db.transactions.create(targetUserId, enrichedTx);
      
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
    assertNotViewer("mengubah transaksi");
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
    assertNotViewer("menghapus transaksi");
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
    assertNotViewer("melakukan transfer dompet");
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
    assertNotViewer("mengatur anggaran");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    await db.budgets.upsert(targetUserId, budget);
    const budgets = await db.budgets.list(userId);
    set({ budgets });
  },

  deleteBudget: async (userId, id) => {
    if (!userId) return;
    assertNotViewer("menghapus anggaran");
    await db.budgets.delete(userId, id);
    const budgets = await db.budgets.list(userId);
    set({ budgets });
  },

  addSavingsGoal: async (userId, goal) => {
    if (!userId) return;
    assertNotViewer("menambah target tabungan");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    await db.savings.create(targetUserId, goal);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  updateSavingsGoal: async (userId, id, updates) => {
    if (!userId) return;
    assertNotViewer("mengubah target tabungan");
    await db.savings.update(userId, id, updates);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  deleteSavingsGoal: async (userId, id) => {
    if (!userId) return;
    assertNotViewer("menghapus target tabungan");
    await db.savings.delete(userId, id);
    const savings = await db.savings.list(userId);
    set({ savings });
  },

  addDebt: async (userId, debt) => {
    if (!userId) return;
    assertNotViewer("menambah catatan utang/piutang");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    await db.debts.create(targetUserId, debt);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  updateDebt: async (userId, id, updates) => {
    if (!userId) return;
    assertNotViewer("mengubah catatan utang/piutang");
    await db.debts.update(userId, id, updates);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  deleteDebt: async (userId, id) => {
    if (!userId) return;
    assertNotViewer("menghapus catatan utang/piutang");
    await db.debts.delete(userId, id);
    const debts = await db.debts.list(userId);
    set({ debts });
  },

  addRecurring: async (userId, rec) => {
    if (!userId) return;
    assertNotViewer("menambah transaksi berulang");
    
    let targetUserId = userId;
    if (userId === "user-joint") {
      const chosenActor = await useActorStore.getState().prompt();
      if (!chosenActor) return;
      targetUserId = chosenActor;
    }

    await db.recurring.create(targetUserId, rec);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  updateRecurring: async (userId, id, updates) => {
    if (!userId) return;
    assertNotViewer("mengubah transaksi berulang");
    await db.recurring.update(userId, id, updates);
    const recurring = await db.recurring.list(userId);
    set({ recurring });
  },

  deleteRecurring: async (userId, id) => {
    if (!userId) return;
    assertNotViewer("menghapus transaksi berulang");
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
