/** @format */

// Data Repository for MoneyFlow Pro
// Coordinates data between UI/State and Supabase or LocalStorage fallback

import { supabase, isSupabaseConfigured } from "./supabase";
import type { UserProfile, UserSettings, Wallet, Category, SubCategory, Transaction, WalletTransfer, Budget, SavingsGoal, Debt, RecurringTransaction, AppNotification, FinancialHealthLog } from "../types";

// =========================================================================
// DEBUG HELPER
// =========================================================================
const dbLog = (operation: string, table: string, payload?: any, error?: any) => {
  if (error) {
    console.error(`[DB] ❌ ${operation} ${table}:`, error?.message || error, "| Payload:", payload);
  } else {
    console.log(`[DB] ✅ ${operation} ${table}:`, payload !== undefined ? payload : "(no payload)");
  }
};

// =========================================================================
// MOCK & SEED DATA (For LocalStorage Fallback)
// =========================================================================

const DEFAULT_PROFILE: UserProfile = {
  id: "local-user",
  name: "Pengguna MoneyFlow",
  photo_url: "",
  currency: "Rp",
  monthly_salary: 8500000,
  financial_target: 30000000,
};

const DEFAULT_SETTINGS: UserSettings = {
  id: "local-settings",
  user_id: "local-user",
  theme: "light",
  notifications_enabled: true,
  low_balance_threshold: 500000,
};

const DEFAULT_WALLETS: Wallet[] = [
  { id: "w-cash", user_id: "local-user", name: "Cash (Tunai)", type: "cash", balance: 450000, icon: "Wallet", color: "#10B981" },
  { id: "w-bca", user_id: "local-user", name: "Bank BCA", type: "bank", provider: "BCA", balance: 5200000, icon: "CreditCard", color: "#2563EB" },
  { id: "w-mandiri", user_id: "local-user", name: "Bank Mandiri", type: "bank", provider: "Mandiri", balance: 2400000, icon: "LayoutGrid", color: "#F59E0B" },
  { id: "w-gopay", user_id: "local-user", name: "GoPay", type: "e-wallet", provider: "GoPay", balance: 180000, icon: "Smartphone", color: "#00D166" },
];

const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: "cat-makanan", user_id: null, name: "Makanan & Minuman", type: "expense", icon: "Utensils", color: "#F59E0B" },
  { id: "cat-trans", user_id: null, name: "Transportasi", type: "expense", icon: "Car", color: "#3B82F6" },
  { id: "cat-tagihan", user_id: null, name: "Tagihan", type: "expense", icon: "FileText", color: "#EF4444" },
  { id: "cat-cicilan", user_id: null, name: "Cicilan", type: "expense", icon: "Clock", color: "#8B5CF6" },
  { id: "cat-belanja", user_id: null, name: "Belanja", type: "expense", icon: "ShoppingBag", color: "#EC4899" },
  { id: "cat-hiburan", user_id: null, name: "Hiburan", type: "expense", icon: "Gamepad2", color: "#10B981" },
  { id: "cat-kesehatan", user_id: null, name: "Kesehatan", type: "expense", icon: "HeartPulse", color: "#14B8A6" },
  { id: "cat-pendidikan", user_id: null, name: "Pendidikan", type: "expense", icon: "GraduationCap", color: "#0EA5E9" },
  { id: "cat-lainnya", user_id: null, name: "Lainnya", type: "expense", icon: "HelpCircle", color: "#6B7280" },
  // Income Categories
  { id: "cat-gaji", user_id: null, name: "Gaji Bulanan", type: "income", icon: "DollarSign", color: "#10B981" },
  { id: "cat-freelance", user_id: null, name: "Freelance", type: "income", icon: "Briefcase", color: "#3B82F6" },
  { id: "cat-bonus", user_id: null, name: "Bonus", type: "income", icon: "Gift", color: "#F59E0B" },
  { id: "cat-thr", user_id: null, name: "THR", type: "income", icon: "Award", color: "#8B5CF6" },
  { id: "cat-investasi", user_id: null, name: "Investasi", type: "income", icon: "TrendingUp", color: "#059669" },
  { id: "cat-inc-lainnya", user_id: null, name: "Pemasukan Lainnya", type: "income", icon: "HelpCircle", color: "#6B7280" },
];

const DEFAULT_SUB_CATEGORIES: SubCategory[] = [
  // Makanan
  { id: "sub-jajan", category_id: "cat-makanan", name: "Jajan" },
  { id: "sub-sarapan", category_id: "cat-makanan", name: "Sarapan" },
  { id: "sub-makansiang", category_id: "cat-makanan", name: "Makan Siang" },
  { id: "sub-makanmalam", category_id: "cat-makanan", name: "Makan Malam" },
  { id: "sub-minuman", category_id: "cat-makanan", name: "Minuman/Kopi" },
  // Transportasi
  { id: "sub-parkir", category_id: "cat-trans", name: "Parkir" },
  { id: "sub-bensin", category_id: "cat-trans", name: "Bensin" },
  { id: "sub-tol", category_id: "cat-trans", name: "Tol" },
  { id: "sub-servis", category_id: "cat-trans", name: "Servis Kendaraan" },
  // Tagihan
  { id: "sub-listrik", category_id: "cat-tagihan", name: "Listrik" },
  { id: "sub-air", category_id: "cat-tagihan", name: "Air" },
  { id: "sub-internet", category_id: "cat-tagihan", name: "Internet" },
  { id: "sub-bpjs", category_id: "cat-tagihan", name: "BPJS" },
  // Cicilan
  { id: "sub-motor", category_id: "cat-cicilan", name: "Cicilan Motor" },
  { id: "sub-hp", category_id: "cat-cicilan", name: "Cicilan HP" },
  { id: "sub-laptop", category_id: "cat-cicilan", name: "Cicilan Laptop" },
  // Belanja
  { id: "sub-shopee", category_id: "cat-belanja", name: "Shopee" },
  { id: "sub-tokped", category_id: "cat-belanja", name: "Tokopedia" },
  { id: "sub-elektronik", category_id: "cat-belanja", name: "Elektronik" },
  { id: "sub-pakaian", category_id: "cat-belanja", name: "Pakaian" },
  // Hiburan
  { id: "sub-nongkrong", category_id: "cat-hiburan", name: "Nongkrong" },
  { id: "sub-bioskop", category_id: "cat-hiburan", name: "Bioskop" },
  { id: "sub-game", category_id: "cat-hiburan", name: "Game" },
];

// Generate dynamic dates relative to current date
const getDateOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  // Income
  { id: "t-inc-1", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-gaji", type: "income", amount: 8500000, description: "Gaji Bulanan Juni", date: getDateOffset(17) },
  { id: "t-inc-2", user_id: "local-user", wallet_id: "w-jago", category_id: "cat-freelance", type: "income", amount: 1500000, description: "Project landing page", date: getDateOffset(10) },
  { id: "t-inc-3", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-investasi", type: "income", amount: 350000, description: "Dividen Saham", date: getDateOffset(3) },

  // Expenses
  { id: "t-exp-1", user_id: "local-user", wallet_id: "w-cash", category_id: "cat-makanan", sub_category_id: "sub-sarapan", type: "expense", amount: 25000, description: "Nasi Uduk", date: getDateOffset(0) },
  { id: "t-exp-2", user_id: "local-user", wallet_id: "w-gopay", category_id: "cat-makanan", sub_category_id: "sub-minuman", type: "expense", amount: 48000, description: "Kopi Kenangan Senja", date: getDateOffset(0) },
  { id: "t-exp-3", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-trans", sub_category_id: "sub-bensin", type: "expense", amount: 250000, description: "Bensin Mobil Pertamax", date: getDateOffset(1) },
  { id: "t-exp-4", user_id: "local-user", wallet_id: "w-gopay", category_id: "cat-makanan", sub_category_id: "sub-makansiang", type: "expense", amount: 65000, description: "Makan siang ojol", date: getDateOffset(1) },
  { id: "t-exp-5", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-tagihan", sub_category_id: "sub-internet", type: "expense", amount: 350000, description: "Internet IndiHome", date: getDateOffset(3) },
  { id: "t-exp-6", user_id: "local-user", wallet_id: "w-jago", category_id: "cat-cicilan", sub_category_id: "sub-hp", type: "expense", amount: 450000, description: "Cicilan HP Tokopedia", date: getDateOffset(5) },
  { id: "t-exp-7", user_id: "local-user", wallet_id: "w-cash", category_id: "cat-makanan", sub_category_id: "sub-makanmalam", type: "expense", amount: 35000, description: "Sate Padang", date: getDateOffset(2) },
  { id: "t-exp-8", user_id: "local-user", wallet_id: "w-jago", category_id: "cat-hiburan", sub_category_id: "sub-nongkrong", type: "expense", amount: 180000, description: "Nongkrong Cafe", date: getDateOffset(4) },
  { id: "t-exp-9", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-belanja", sub_category_id: "sub-shopee", type: "expense", amount: 520000, description: "Beli Sepatu Baru", date: getDateOffset(8) },
  { id: "t-exp-10", user_id: "local-user", wallet_id: "w-jago", category_id: "cat-kesehatan", type: "expense", amount: 120000, description: "Beli Vitamin C & Obat", date: getDateOffset(12) },
  { id: "t-exp-11", user_id: "local-user", wallet_id: "w-cash", category_id: "cat-trans", sub_category_id: "sub-parkir", type: "expense", amount: 10000, description: "Parkir Mall", date: getDateOffset(0) },

  // Savings Transactions (representing saving allocations)
  { id: "t-sav-1", user_id: "local-user", wallet_id: "w-jago", type: "savings", amount: 1000000, description: "Tabungan Laptop Baru", date: getDateOffset(15) },
  { id: "t-sav-2", user_id: "local-user", wallet_id: "w-bca", type: "savings", amount: 500000, description: "Tabungan Darurat", date: getDateOffset(15) },

  // Debt Transactions (representing debt actions)
  { id: "t-debt-pay-1", user_id: "local-user", wallet_id: "w-cash", type: "debt_payment", amount: 100000, description: "Cicil bayar utang Budi", date: getDateOffset(2) },
];

const DEFAULT_TRANSFERS: WalletTransfer[] = [
  { id: "tf-1", user_id: "local-user", from_wallet_id: "w-bca", to_wallet_id: "w-gopay", amount: 500000, description: "Topup GoPay", date: getDateOffset(2) },
  { id: "tf-2", user_id: "local-user", from_wallet_id: "w-bca", to_wallet_id: "w-cash", amount: 300000, description: "Tarik Tunai ATM", date: getDateOffset(5) },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: "b-1", user_id: "local-user", category_id: "cat-makanan", amount: 1800000, month: 6, year: 2026 },
  { id: "b-2", user_id: "local-user", category_id: "cat-trans", amount: 600000, month: 6, year: 2026 },
  { id: "b-3", user_id: "local-user", category_id: "cat-hiburan", amount: 400000, month: 6, year: 2026 },
  { id: "b-4", user_id: "local-user", category_id: "cat-belanja", amount: 800000, month: 6, year: 2026 },
];

const DEFAULT_SAVINGS: SavingsGoal[] = [
  { id: "sg-laptop", user_id: "local-user", name: "Gaming Laptop", target_amount: 15000000, current_amount: 3500000, deadline: "2027-12-31" },
  { id: "sg-liburan", user_id: "local-user", name: "Liburan Bali", target_amount: 6000000, current_amount: 1200000, deadline: "2026-12-25" },
];

const DEFAULT_DEBTS: Debt[] = [
  { id: "d-budi", user_id: "local-user", type: "borrowed", person_name: "Budi (Teman)", amount: 300000, remaining_amount: 200000, due_date: getDateOffset(-5), status: "pending", description: "Pinjam uang makan" },
  { id: "d-siti", user_id: "local-user", type: "lent", person_name: "Siti (Rekan Kerja)", amount: 150000, remaining_amount: 150000, due_date: getDateOffset(-1), status: "pending", description: "Talangan makan siang" },
];

const DEFAULT_RECURRING: RecurringTransaction[] = [
  { id: "rec-netflix", user_id: "local-user", wallet_id: "w-jago", category_id: "cat-hiburan", sub_category_id: "sub-game", type: "expense", amount: 186000, description: "Netflix Premium", frequency: "monthly", interval_day: 25, last_generated: "2026-05-25", next_date: "2026-06-25", status: "active" },
  { id: "rec-internet", user_id: "local-user", wallet_id: "w-bca", category_id: "cat-tagihan", sub_category_id: "sub-internet", type: "expense", amount: 350000, description: "Tagihan IndiHome", frequency: "monthly", interval_day: 5, last_generated: "2026-06-05", next_date: "2026-07-05", status: "active" },
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id: "n-1", user_id: "local-user", title: "Dompet Terisi Gaji", message: "Hore! Transaksi recurring gaji sebesar Rp8.500.000 berhasil dimasukkan.", type: "system", is_read: true, created_at: getDateOffset(17) + "T09:00:00Z" },
  { id: "n-2", user_id: "local-user", title: "Utang Budi Jatuh Tempo", message: "Pinjaman sebesar Rp200.000 ke Budi sudah melewati batas tanggal tempo.", type: "debt", is_read: false, created_at: getDateOffset(1) + "T08:00:00Z" },
  { id: "n-3", user_id: "local-user", title: "Tagihan Berulang Masuk", message: "Tagihan IndiHome sebesar Rp350.000 otomatis tercatat bulan ini.", type: "bill", is_read: false, created_at: getDateOffset(3) + "T10:00:00Z" },
];

// Helper to initialize local storage
const initializeLocalStorage = () => {
  const checkAndSet = (key: string, defaultValue: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
    }
  };

  checkAndSet("mf_profile", DEFAULT_PROFILE);
  checkAndSet("mf_settings", DEFAULT_SETTINGS);
  checkAndSet("mf_wallets", DEFAULT_WALLETS);
  checkAndSet("mf_categories", DEFAULT_CATEGORIES);
  checkAndSet("mf_sub_categories", DEFAULT_SUB_CATEGORIES);
  checkAndSet("mf_transactions", DEFAULT_TRANSACTIONS);
  checkAndSet("mf_transfers", DEFAULT_TRANSFERS);
  checkAndSet("mf_budgets", DEFAULT_BUDGETS);
  checkAndSet("mf_savings", DEFAULT_SAVINGS);
  checkAndSet("mf_debts", DEFAULT_DEBTS);
  checkAndSet("mf_recurring", DEFAULT_RECURRING);
  checkAndSet("mf_notifications", DEFAULT_NOTIFICATIONS);
  checkAndSet("mf_health_logs", []);
};

// Auto run initialization on load
if (typeof window !== "undefined") {
  initializeLocalStorage();
}

// Helper getter & setter for LocalStorage
const getLS = <T>(key: string): T => {
  return JSON.parse(localStorage.getItem(key) || "[]");
};

const setLS = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// =========================================================================
// REPOSITORY IMPLEMENTATION
// =========================================================================

export const db = {
  // -----------------------------------------------------------------------
  // AUTH & PROFILES
  // -----------------------------------------------------------------------
  profile: {
    get: async (userId: string): Promise<UserProfile> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] GET profile, user_id:", userId);
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
        dbLog("SELECT", "profiles", { userId }, error);
        if (!error && data) return data;

        // Auto-create profile if missing (PGRST116: no rows returned)
        if (error && error.code === "PGRST116") {
          const newProfile: UserProfile = {
            id: userId,
            name: "User MoneyFlow",
            currency: "Rp",
            monthly_salary: 0,
            financial_target: 0,
          };
          console.log("[DB] INSERT profile:", newProfile);
          const { data: created, error: createErr } = await supabase.from("profiles").insert([newProfile]).select().single();
          dbLog("INSERT", "profiles", newProfile, createErr);
          if (created) return created;
          return newProfile;
        }
      }
      // Fallback
      const profile = localStorage.getItem("mf_profile") ? JSON.parse(localStorage.getItem("mf_profile")!) : DEFAULT_PROFILE;
      return profile;
    },
    update: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] UPDATE profile, user_id:", userId, "updates:", updates);
        const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
        dbLog("UPDATE", "profiles", updates, error);
        if (!error && data) return data;
      }
      // Fallback
      const profile = { ...(await db.profile.get(userId)), ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem("mf_profile", JSON.stringify(profile));
      return profile;
    },
  },

  settings: {
    get: async (userId: string): Promise<UserSettings> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();
        if (!error && data) return data;

        // Auto-create settings if missing (PGRST116: no rows returned)
        if (error && error.code === "PGRST116") {
          const newSettings: any = {
            user_id: userId,
            theme: "light",
            notifications_enabled: true,
            low_balance_threshold: 500000,
          };
          const { data: created } = await supabase.from("user_settings").insert([newSettings]).select().single();
          if (created) return created;
          return newSettings;
        }
      }
      return localStorage.getItem("mf_settings") ? JSON.parse(localStorage.getItem("mf_settings")!) : DEFAULT_SETTINGS;
    },
    update: async (userId: string, updates: Partial<UserSettings>): Promise<UserSettings> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("user_settings").update(updates).eq("user_id", userId).select().single();
        if (!error && data) return data;
      }
      const settings = { ...(await db.settings.get(userId)), ...updates };
      localStorage.setItem("mf_settings", JSON.stringify(settings));
      return settings;
    },
  },

  // -----------------------------------------------------------------------
  // WALLETS
  // -----------------------------------------------------------------------
  wallets: {
    list: async (userId: string): Promise<Wallet[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] LIST wallets, user_id:", userId);
        const { data, error } = await supabase.from("wallets").select("*").eq("user_id", userId).order("name");
        dbLog("SELECT", "wallets", { userId, count: data?.length }, error);
        if (!error && data) return data;
        if (error) console.error("[DB] wallets list error:", error);
      }
      return getLS<Wallet[]>("mf_wallets");
    },
    create: async (userId: string, wallet: Omit<Wallet, "id" | "user_id">): Promise<Wallet> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const payload = { ...wallet, user_id: userId };
        console.log("[DB] INSERT wallet:", payload);
        const { data, error } = await supabase
          .from("wallets")
          .insert([payload])
          .select()
          .single();
        dbLog("INSERT", "wallets", payload, error);
        if (!error && data) return data;
        if (error) throw new Error(`Gagal membuat wallet: ${error.message}`);
      }
      const list = getLS<Wallet[]>("mf_wallets");
      const newWallet: Wallet = { ...wallet, id: "w-" + Math.random().toString(36).substring(2, 9), user_id: userId, balance: Number(wallet.balance) || 0 };
      list.push(newWallet);
      setLS("mf_wallets", list);
      return newWallet;
    },
    update: async (userId: string, id: string, updates: Partial<Wallet>): Promise<Wallet> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] UPDATE wallet, id:", id, "updates:", updates);
        const { data, error } = await supabase.from("wallets").update(updates).eq("id", id).eq("user_id", userId).select().single();
        dbLog("UPDATE", "wallets", { id, updates }, error);
        if (!error && data) return data;
        if (error) throw new Error(`Gagal update wallet: ${error.message}`);
      }
      const list = getLS<Wallet[]>("mf_wallets");
      const idx = list.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error("Wallet not found");

      list[idx] = { ...list[idx], ...updates, balance: updates.balance !== undefined ? Number(updates.balance) : list[idx].balance };
      setLS("mf_wallets", list);
      return list[idx];
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] DELETE wallet, id:", id);
        const { error } = await supabase.from("wallets").delete().eq("id", id).eq("user_id", userId);
        dbLog("DELETE", "wallets", { id }, error);
        if (error) throw new Error(`Gagal hapus wallet: ${error.message}`);
        return !error;
      }
      const list = getLS<Wallet[]>("mf_wallets");
      const filtered = list.filter((w) => w.id !== id);
      setLS("mf_wallets", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // -----------------------------------------------------------------------
  categories: {
    list: async (userId: string): Promise<Category[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("categories").select("*").or(`user_id.eq.${userId},user_id.is.null`);
        if (!error && data) return data;
      }
      return getLS<Category[]>("mf_categories");
    },
    create: async (userId: string, category: Omit<Category, "id" | "user_id">): Promise<Category> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("categories")
          .insert([{ ...category, user_id: userId }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<Category[]>("mf_categories");
      const newCategory: Category = { ...category, id: "cat-" + Math.random().toString(36).substring(2, 9), user_id: userId };
      list.push(newCategory);
      setLS("mf_categories", list);
      return newCategory;
    },
    subcategories: {
      list: async (): Promise<SubCategory[]> => {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from("sub_categories").select("*");
          if (!error && data) return data;
        }
        return getLS<SubCategory[]>("mf_sub_categories");
      },
      create: async (categoryId: string, name: string): Promise<SubCategory> => {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("sub_categories")
            .insert([{ category_id: categoryId, name }])
            .select()
            .single();
          if (!error && data) return data;
        }
        const list = getLS<SubCategory[]>("mf_sub_categories");
        const newSub: SubCategory = { id: "sub-" + Math.random().toString(36).substring(2, 9), category_id: categoryId, name };
        list.push(newSub);
        setLS("mf_sub_categories", list);
        return newSub;
      },
    },
  },

  // -----------------------------------------------------------------------
  // TRANSACTIONS
  // -----------------------------------------------------------------------
  transactions: {
    list: async (userId: string): Promise<Transaction[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        console.log("[DB] LIST transactions, user_id:", userId);
        const { data, error } = await supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false });
        dbLog("SELECT", "transactions", { userId, count: data?.length }, error);
        if (!error && data) return data;
        if (error) console.error("[DB] transactions list error:", error);
      }
      return getLS<Transaction[]>("mf_transactions").sort((a, b) => b.date.localeCompare(a.date));
    },
    create: async (userId: string, tx: Omit<Transaction, "id" | "user_id">): Promise<Transaction> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const payload = { ...tx, user_id: userId };
        console.log("[DB] INSERT transaction:", payload);
        const { data, error } = await supabase
          .from("transactions")
          .insert([payload])
          .select()
          .single();
        dbLog("INSERT", "transactions", payload, error);
        if (!error && data) return data;
        if (error) throw new Error(`Gagal simpan transaksi: ${error.message}`);
      }

      const newTx: Transaction = {
        ...tx,
        id: "t-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        amount: Number(tx.amount),
      };

      // Handle balance updating locally
      const wallets = getLS<Wallet[]>("mf_wallets");
      const walletIdx = wallets.findIndex((w) => w.id === tx.wallet_id);
      if (walletIdx !== -1) {
        const adjustment = tx.type === "income" ? newTx.amount : -newTx.amount;
        wallets[walletIdx].balance += adjustment;
        setLS("mf_wallets", wallets);
      }

      // If it is saving type, we increase the savings goal balance automatically if it matches description or a selected goal
      if (tx.type === "savings") {
        const savings = getLS<SavingsGoal[]>("mf_savings");
        // Simple heuristic: match saving goal name in the description or just apply to the first active goal
        const matchedGoal = savings.find((s) => tx.description?.toLowerCase().includes(s.name.toLowerCase()));
        if (matchedGoal) {
          matchedGoal.current_amount += newTx.amount;
          setLS("mf_savings", savings);
        } else if (savings.length > 0) {
          savings[0].current_amount += newTx.amount;
          setLS("mf_savings", savings);
        }
      }

      // If it is a debt payment, reduce the remaining debt amount
      if (tx.type === "debt_payment") {
        const debts = getLS<Debt[]>("mf_debts");
        const matchedDebt = debts.find((d) => tx.description?.toLowerCase().includes(d.person_name.toLowerCase()) && d.status === "pending");
        if (matchedDebt) {
          matchedDebt.remaining_amount = Math.max(0, matchedDebt.remaining_amount - newTx.amount);
          if (matchedDebt.remaining_amount === 0) matchedDebt.status = "paid";
          setLS("mf_debts", debts);
        }
      }

      const list = getLS<Transaction[]>("mf_transactions");
      list.push(newTx);
      setLS("mf_transactions", list);
      return newTx;
    },
    update: async (userId: string, id: string, updates: Partial<Transaction>): Promise<Transaction> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
        if (!error && data) return data;
      }

      const list = getLS<Transaction[]>("mf_transactions");
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("Transaction not found");

      const oldTx = list[idx];
      const newTx = { ...oldTx, ...updates };

      // Handle balance updating locally (revert old, apply new)
      const wallets = getLS<Wallet[]>("mf_wallets");

      // Revert old transaction on old wallet
      const oldWalletIdx = wallets.findIndex((w) => w.id === oldTx.wallet_id);
      if (oldWalletIdx !== -1) {
        const oldAdjustment = oldTx.type === "income" ? -oldTx.amount : oldTx.amount;
        wallets[oldWalletIdx].balance += oldAdjustment;
      }

      // Apply new transaction on new wallet
      const newWalletIdx = wallets.findIndex((w) => w.id === newTx.wallet_id);
      if (newWalletIdx !== -1) {
        const newAdjustment = newTx.type === "income" ? newTx.amount : -newTx.amount;
        wallets[newWalletIdx].balance += newAdjustment;
      }

      setLS("mf_wallets", wallets);

      list[idx] = newTx;
      setLS("mf_transactions", list);
      return newTx;
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        return !error;
      }

      const list = getLS<Transaction[]>("mf_transactions");
      const tx = list.find((t) => t.id === id);
      if (!tx) return false;

      // Handle balance updating locally (revert transaction)
      const wallets = getLS<Wallet[]>("mf_wallets");
      const walletIdx = wallets.findIndex((w) => w.id === tx.wallet_id);
      if (walletIdx !== -1) {
        const adjustment = tx.type === "income" ? -tx.amount : tx.amount;
        wallets[walletIdx].balance += adjustment;
        setLS("mf_wallets", wallets);
      }

      const filtered = list.filter((t) => t.id !== id);
      setLS("mf_transactions", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // TRANSFERS
  // -----------------------------------------------------------------------
  transfers: {
    list: async (userId: string): Promise<WalletTransfer[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("wallet_transfers").select("*").eq("user_id", userId).order("date", { ascending: false });
        if (!error && data) return data;
      }
      return getLS<WalletTransfer[]>("mf_transfers").sort((a, b) => b.date.localeCompare(a.date));
    },
    create: async (userId: string, transfer: Omit<WalletTransfer, "id" | "user_id">): Promise<WalletTransfer> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("wallet_transfers")
          .insert([{ ...transfer, user_id: userId }])
          .select()
          .single();
        if (!error && data) return data;
      }

      const newTf: WalletTransfer = {
        ...transfer,
        id: "tf-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        amount: Number(transfer.amount),
      };

      // Handle wallets balance changes
      const wallets = getLS<Wallet[]>("mf_wallets");
      const fromIdx = wallets.findIndex((w) => w.id === transfer.from_wallet_id);
      const toIdx = wallets.findIndex((w) => w.id === transfer.to_wallet_id);

      if (fromIdx !== -1) wallets[fromIdx].balance -= newTf.amount;
      if (toIdx !== -1) wallets[toIdx].balance += newTf.amount;
      setLS("mf_wallets", wallets);

      const list = getLS<WalletTransfer[]>("mf_transfers");
      list.push(newTf);
      setLS("mf_transfers", list);
      return newTf;
    },
  },

  // -----------------------------------------------------------------------
  // BUDGETS
  // -----------------------------------------------------------------------
  budgets: {
    list: async (userId: string): Promise<Budget[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("budgets").select("*").eq("user_id", userId);
        if (!error && data) return data;
      }
      return getLS<Budget[]>("mf_budgets");
    },
    upsert: async (userId: string, budget: Omit<Budget, "id" | "user_id">): Promise<Budget> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        // Supabase upsert requires unique constraint user_id, category_id, month, year
        const { data, error } = await supabase
          .from("budgets")
          .upsert([{ ...budget, user_id: userId }], { onConflict: "user_id,category_id,month,year" })
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<Budget[]>("mf_budgets");
      const idx = list.findIndex((b) => b.category_id === budget.category_id && b.month === budget.month && b.year === budget.year);

      if (idx !== -1) {
        list[idx].amount = Number(budget.amount);
        setLS("mf_budgets", list);
        return list[idx];
      } else {
        const newBudget: Budget = { ...budget, id: "b-" + Math.random().toString(36).substring(2, 9), user_id: userId, amount: Number(budget.amount) };
        list.push(newBudget);
        setLS("mf_budgets", list);
        return newBudget;
      }
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("budgets").delete().eq("id", id);
        return !error;
      }
      const list = getLS<Budget[]>("mf_budgets");
      const filtered = list.filter((b) => b.id !== id);
      setLS("mf_budgets", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // SAVINGS GOALS
  // -----------------------------------------------------------------------
  savings: {
    list: async (userId: string): Promise<SavingsGoal[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("savings_goals").select("*").eq("user_id", userId);
        if (!error && data) return data;
      }
      return getLS<SavingsGoal[]>("mf_savings");
    },
    create: async (userId: string, goal: Omit<SavingsGoal, "id" | "user_id">): Promise<SavingsGoal> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("savings_goals")
          .insert([{ ...goal, user_id: userId }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<SavingsGoal[]>("mf_savings");
      const newGoal: SavingsGoal = { ...goal, id: "sg-" + Math.random().toString(36).substring(2, 9), user_id: userId, current_amount: Number(goal.current_amount) || 0, target_amount: Number(goal.target_amount) };
      list.push(newGoal);
      setLS("mf_savings", list);
      return newGoal;
    },
    update: async (userId: string, id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("savings_goals").update(updates).eq("id", id).select().single();
        if (!error && data) return data;
      }
      const list = getLS<SavingsGoal[]>("mf_savings");
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error("Goal not found");

      list[idx] = { ...list[idx], ...updates, target_amount: updates.target_amount !== undefined ? Number(updates.target_amount) : list[idx].target_amount, current_amount: updates.current_amount !== undefined ? Number(updates.current_amount) : list[idx].current_amount };
      setLS("mf_savings", list);
      return list[idx];
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("savings_goals").delete().eq("id", id);
        return !error;
      }
      const list = getLS<SavingsGoal[]>("mf_savings");
      const filtered = list.filter((s) => s.id !== id);
      setLS("mf_savings", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // DEBTS
  // -----------------------------------------------------------------------
  debts: {
    list: async (userId: string): Promise<Debt[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("debts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        if (!error && data) return data;
      }
      return getLS<Debt[]>("mf_debts").sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    },
    create: async (userId: string, debt: Omit<Debt, "id" | "user_id" | "status">): Promise<Debt> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("debts")
          .insert([{ ...debt, user_id: userId, status: "pending" }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<Debt[]>("mf_debts");
      const newDebt: Debt = {
        ...debt,
        id: "d-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        status: "pending",
        amount: Number(debt.amount),
        remaining_amount: Number(debt.remaining_amount) || Number(debt.amount),
        created_at: new Date().toISOString(),
      };

      // If adding debt and starting wallet was specified, update wallet balance:
      // - Borrowed: cash enters our wallet (increase balance)
      // - Lent: cash leaves our wallet (decrease balance)
      // For this simple trigger imitation, let's keep it clean: users can choose to log it or manually adjust.

      list.push(newDebt);
      setLS("mf_debts", list);
      return newDebt;
    },
    update: async (userId: string, id: string, updates: Partial<Debt>): Promise<Debt> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("debts").update(updates).eq("id", id).select().single();
        if (!error && data) return data;
      }
      const list = getLS<Debt[]>("mf_debts");
      const idx = list.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error("Debt record not found");

      const updated = { ...list[idx], ...updates };
      if (updated.remaining_amount <= 0) {
        updated.remaining_amount = 0;
        updated.status = "paid";
      }
      list[idx] = updated;
      setLS("mf_debts", list);
      return updated;
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("debts").delete().eq("id", id);
        return !error;
      }
      const list = getLS<Debt[]>("mf_debts");
      const filtered = list.filter((d) => d.id !== id);
      setLS("mf_debts", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // RECURRING TRANSACTIONS
  // -----------------------------------------------------------------------
  recurring: {
    list: async (userId: string): Promise<RecurringTransaction[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("recurring_transactions").select("*").eq("user_id", userId);
        if (!error && data) return data;
      }
      return getLS<RecurringTransaction[]>("mf_recurring");
    },
    create: async (userId: string, rec: Omit<RecurringTransaction, "id" | "user_id" | "status">): Promise<RecurringTransaction> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("recurring_transactions")
          .insert([{ ...rec, user_id: userId, status: "active" }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<RecurringTransaction[]>("mf_recurring");
      const newRec: RecurringTransaction = {
        ...rec,
        id: "rec-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        status: "active",
        amount: Number(rec.amount),
      };
      list.push(newRec);
      setLS("mf_recurring", list);
      return newRec;
    },
    update: async (userId: string, id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("recurring_transactions").update(updates).eq("id", id).select().single();
        if (!error && data) return data;
      }
      const list = getLS<RecurringTransaction[]>("mf_recurring");
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Recurring template not found");

      list[idx] = { ...list[idx], ...updates };
      setLS("mf_recurring", list);
      return list[idx];
    },
    delete: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
        return !error;
      }
      const list = getLS<RecurringTransaction[]>("mf_recurring");
      const filtered = list.filter((r) => r.id !== id);
      setLS("mf_recurring", filtered);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // NOTIFICATIONS
  // -----------------------------------------------------------------------
  notifications: {
    list: async (userId: string): Promise<AppNotification[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        if (!error && data) return data;
      }
      return getLS<AppNotification[]>("mf_notifications").sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    },
    create: async (userId: string, notif: Omit<AppNotification, "id" | "user_id" | "is_read" | "created_at">): Promise<AppNotification> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("notifications")
          .insert([{ ...notif, user_id: userId, is_read: false }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<AppNotification[]>("mf_notifications");
      const newNotif: AppNotification = {
        ...notif,
        id: "n-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      list.unshift(newNotif);
      setLS("mf_notifications", list);
      return newNotif;
    },
    markAsRead: async (userId: string, id: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
        return !error;
      }
      const list = getLS<AppNotification[]>("mf_notifications");
      const idx = list.findIndex((n) => n.id === id);
      if (idx !== -1) {
        list[idx].is_read = true;
        setLS("mf_notifications", list);
        return true;
      }
      return false;
    },
    markAllAsRead: async (userId: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
        return !error;
      }
      const list = getLS<AppNotification[]>("mf_notifications");
      const updated = list.map((n) => ({ ...n, is_read: true }));
      setLS("mf_notifications", updated);
      return true;
    },
    clear: async (userId: string): Promise<boolean> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
        return !error;
      }
      setLS("mf_notifications", []);
      return true;
    },
  },

  // -----------------------------------------------------------------------
  // FINANCIAL HEALTH LOGS
  // -----------------------------------------------------------------------
  healthLogs: {
    list: async (userId: string): Promise<FinancialHealthLog[]> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase.from("financial_health_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false });
        if (!error && data) return data;
      }
      return getLS<FinancialHealthLog[]>("mf_health_logs");
    },
    log: async (userId: string, log: Omit<FinancialHealthLog, "id" | "user_id" | "created_at">): Promise<FinancialHealthLog> => {
      if (isSupabaseConfigured && userId !== "local-user") {
        const { data, error } = await supabase
          .from("financial_health_logs")
          .insert([{ ...log, user_id: userId }])
          .select()
          .single();
        if (!error && data) return data;
      }
      const list = getLS<FinancialHealthLog[]>("mf_health_logs");
      const newLog: FinancialHealthLog = {
        ...log,
        id: "hl-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      list.push(newLog);
      setLS("mf_health_logs", list);
      return newLog;
    },
  },
};

// =========================================================================
// AUTOMATED RECURRING ENGINE RUNNER
// =========================================================================
// This checks if there are recurring templates that are due, creates transactions, and updates dates.
export const runRecurringEngine = async (userId: string): Promise<number> => {
  const templates = await db.recurring.list(userId);
  const activeTemplates = templates.filter((t) => t.status === "active");
  const today = new Date(); // Tanggal hari ini yang sebenarnya
  today.setHours(23, 59, 59, 0); // set ke akhir hari agar semua kejadian hari ini diproses
  let count = 0;

  for (const template of activeTemplates) {
    let nextDate = new Date(template.next_date + "T12:00:00");

    // Process recurring tasks that have passed their next_date
    while (nextDate <= today) {
      // 1. Create transaction
      await db.transactions.create(userId, {
        wallet_id: template.wallet_id,
        category_id: template.category_id,
        sub_category_id: template.sub_category_id,
        type: template.type,
        amount: template.amount,
        description: `[Berulang] ${template.description || ""}`.trim(),
        date: template.next_date,
      });

      // 2. Add system notification
      await db.notifications.create(userId, {
        title: `Transaksi Berulang Terbuat`,
        message: `Transaksi '${template.description}' sebesar Rp${template.amount.toLocaleString("id-ID")} telah otomatis tercatat.`,
        type: "bill",
      });

      // 3. Compute new next_date
      if (template.frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (template.frequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (template.frequency === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      count++;

      // Update template next_date
      const nextDateStr = nextDate.toISOString().split("T")[0];
      await db.recurring.update(userId, template.id, {
        last_generated: template.next_date,
        next_date: nextDateStr,
      });
      template.next_date = nextDateStr; // update loop reference
    }
  }

  return count;
};

// =========================================================================
// AUTOMATED DATABASE SEEDER FOR SUPABASE
// =========================================================================
// Automatically initializes system-wide default categories, subcategories,
// and user default wallet if they are missing in Supabase.
export const ensureDatabaseSeeded = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured || userId === "local-user") return;

  try {
    console.log("[Seed] Memulai ensureDatabaseSeeded untuk user:", userId);

    // 1. Double check profile & settings exist (will auto-create if missing)
    await db.profile.get(userId);
    await db.settings.get(userId);

    // 2. Seed Default Categories if not present
    const { data: catCheck, error: catErr } = await supabase.from("categories").select("id").limit(1);
    console.log("[Seed] Cek kategori:", catCheck?.length, "error:", catErr?.message);
    if (!catCheck || catCheck.length === 0) {
      console.log("[Seed] Seeding default categories ke Supabase...");
      for (const cat of DEFAULT_CATEGORIES) {
        const { data: newCat, error: catInsertErr } = await supabase
          .from("categories")
          .insert([
            {
              name: cat.name,
              type: cat.type,
              icon: cat.icon,
              color: cat.color,
              user_id: null, // System-wide category
            },
          ])
          .select()
          .single();
        
        if (catInsertErr) console.error("[Seed] Error insert category:", catInsertErr.message);

        if (newCat) {
          // Find matching default subcategories
          const subs = DEFAULT_SUB_CATEGORIES.filter((sc) => sc.category_id === cat.id);
          if (subs.length > 0) {
            const { error: subErr } = await supabase.from("sub_categories").insert(
              subs.map((s) => ({
                category_id: newCat.id,
                name: s.name,
              })),
            );
            if (subErr) console.error("[Seed] Error insert subcategories:", subErr.message);
          }
        }
      }
    }

    // 3. Seed Default Wallets jika user belum punya wallet
    const { data: walletCheck, error: walletErr } = await supabase.from("wallets").select("id").eq("user_id", userId).limit(1);
    console.log("[Seed] Cek wallet:", walletCheck?.length, "error:", walletErr?.message);
    
    if (!walletCheck || walletCheck.length === 0) {
      console.log("[Seed] Seeding default wallets ke Supabase untuk user:", userId);
      
      const defaultWallets = [
        { user_id: userId, name: "Cash (Tunai)", type: "cash", balance: 0, icon: "Wallet", color: "#10B981" },
        { user_id: userId, name: "Bank BCA", type: "bank", provider: "BCA", balance: 0, icon: "CreditCard", color: "#0066CC" },
        { user_id: userId, name: "Bank Mandiri", type: "bank", provider: "Mandiri", balance: 0, icon: "CreditCard", color: "#003F87" },
        { user_id: userId, name: "Sea Bank", type: "bank", provider: "SeaBank", balance: 0, icon: "CreditCard", color: "#2B5EAB" },
        { user_id: userId, name: "GoPay", type: "e-wallet", provider: "GoPay", balance: 0, icon: "Smartphone", color: "#00AED6" },
        { user_id: userId, name: "Dana", type: "e-wallet", provider: "Dana", balance: 0, icon: "Smartphone", color: "#118EEA" },
        { user_id: userId, name: "OVO", type: "e-wallet", provider: "OVO", balance: 0, icon: "Smartphone", color: "#4C3494" },
      ];

      const { error: walletInsertErr } = await supabase.from("wallets").insert(defaultWallets);
      if (walletInsertErr) {
        console.error("[Seed] Error insert default wallets:", walletInsertErr.message);
        // Fallback: coba insert satu per satu jika batch gagal
        for (const w of defaultWallets) {
          const { error: singleErr } = await supabase.from("wallets").insert([w]);
          if (singleErr) console.error("[Seed] Error insert wallet single:", w.name, singleErr.message);
        }
      } else {
        console.log("[Seed] ✅ Default wallets berhasil dibuat:", defaultWallets.length, "wallet");
      }
    }
    
    console.log("[Seed] ✅ ensureDatabaseSeeded selesai");
  } catch (err) {
    console.error("[Seed] Error in ensureDatabaseSeeded:", err);
  }
};
