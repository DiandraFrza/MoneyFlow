-- =========================================================================
-- MONEYFLOW PRO: FIX DATABASE ACCESS KEYS, RLS & PENGGUNA LAMA
-- =========================================================================
-- Petunjuk: Jalankan seluruh script SQL ini di Supabase SQL Editor.
-- Script ini aman (idempotent), tidak akan menghapus data transaksi,
-- dompet, atau kategori yang sudah diinput sebelumnya.
-- =========================================================================

-- 1. PASTIKAN EXTENSION UUID AKTIF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PASTIKAN KOLOM ACCESS_KEY & PHONE_NUMBER ADA DI TABEL PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_key VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. PASTIKAN TABEL ACCESS_KEYS MEMILIKI STRUKTUR LENGKAP
CREATE TABLE IF NOT EXISTS public.access_keys (
  key VARCHAR PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  activated_at TIMESTAMPTZ,
  id UUID DEFAULT gen_random_uuid()
);

-- Pastikan kolom is_active dan activated_at ada jika tabel sudah pernah dibuat
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 4. NONAKTIFKAN RLS (ROW LEVEL SECURITY) AGAR ANON KEY DAPAT MEMBACA/MENULIS DATA
-- Karena autentikasi telah berpindah ke sistem 11-digit access key tanpa session Supabase Auth,
-- RLS bawaan (auth.uid() = ...) memblokir pembacaan dan update data untuk client anon.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_health_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_keys DISABLE ROW LEVEL SECURITY;

-- 5. RELAKSASI FOREIGN KEY CONSTRAINTS DARI auth.users(id) KE public.profiles(id)
-- Ini mengatasi error "violates foreign key constraint (23503)" saat membuat ruang/dompet/transaksi
-- bagi user yang login via kode akses 11-digit.

-- user_settings
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.user_settings 
  ADD CONSTRAINT user_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- wallets
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
ALTER TABLE public.wallets 
  ADD CONSTRAINT wallets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- categories
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE public.categories 
  ADD CONSTRAINT categories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- transactions
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_created_by_id_fkey;
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- wallet_transfers
ALTER TABLE public.wallet_transfers DROP CONSTRAINT IF EXISTS wallet_transfers_user_id_fkey;
ALTER TABLE public.wallet_transfers 
  ADD CONSTRAINT wallet_transfers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- budgets & logs
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
ALTER TABLE public.budgets 
  ADD CONSTRAINT budgets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.budget_logs DROP CONSTRAINT IF EXISTS budget_logs_user_id_fkey;
ALTER TABLE public.budget_logs 
  ADD CONSTRAINT budget_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- savings_goals & debts
ALTER TABLE public.savings_goals DROP CONSTRAINT IF EXISTS savings_goals_user_id_fkey;
ALTER TABLE public.savings_goals 
  ADD CONSTRAINT savings_goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.debts DROP CONSTRAINT IF EXISTS debts_user_id_fkey;
ALTER TABLE public.debts 
  ADD CONSTRAINT debts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- recurring & notifications & health logs
ALTER TABLE public.recurring_transactions DROP CONSTRAINT IF EXISTS recurring_transactions_user_id_fkey;
ALTER TABLE public.recurring_transactions 
  ADD CONSTRAINT recurring_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.financial_health_logs DROP CONSTRAINT IF EXISTS financial_health_logs_user_id_fkey;
ALTER TABLE public.financial_health_logs 
  ADD CONSTRAINT financial_health_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workspaces & members
ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;
ALTER TABLE public.workspaces 
  ADD CONSTRAINT workspaces_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
ALTER TABLE public.workspace_members 
  ADD CONSTRAINT workspace_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- split_bills
ALTER TABLE public.split_bills DROP CONSTRAINT IF EXISTS split_bills_user_id_fkey;
ALTER TABLE public.split_bills 
  ADD CONSTRAINT split_bills_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- profiles foreign key to auth.users (hapus constraint jika ada agar profile bisa dibuat independen)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 6. GENERATE & BERIKAN 11-DIGIT KEY UNTUK SEMUA USER LAMA
-- Script ini mendeteksi semua user yang ada di tabel profiles dan membuatkan
-- 11-digit access key unik jika mereka belum memilikinya.
DO $$
DECLARE
    r RECORD;
    new_key VARCHAR(11);
BEGIN
    FOR r IN SELECT id, name, phone_number, access_key FROM public.profiles LOOP
        -- Jika belum punya access_key yang valid (11 digit angka)
        IF r.access_key IS NULL OR length(regexp_replace(r.access_key, '[^0-9]', '', 'g')) <> 11 THEN
            -- Generate angka 11 digit acak (10000000000 s/d 99999999999) yang belum terpakai
            LOOP
                new_key := (floor(10000000000 + random() * 89999999999))::text;
                EXIT WHEN NOT EXISTS (SELECT 1 FROM public.access_keys WHERE key = new_key);
            END LOOP;

            -- Simpan key ke profiles user tersebut
            UPDATE public.profiles SET access_key = new_key, updated_at = NOW() WHERE id = r.id;

            -- Masukkan ke tabel access_keys dengan status aktif
            INSERT INTO public.access_keys (key, user_id, user_name, phone_number, is_active, activated_at, created_at)
            VALUES (new_key, r.id, coalesce(r.name, 'User'), r.phone_number, true, NOW(), NOW())
            ON CONFLICT (key) DO UPDATE SET
                user_id = r.id,
                user_name = coalesce(r.name, 'User'),
                is_active = true,
                activated_at = coalesce(public.access_keys.activated_at, NOW());
        ELSE
            -- Jika sudah punya access_key, pastikan terdaftar di tabel access_keys
            INSERT INTO public.access_keys (key, user_id, user_name, phone_number, is_active, activated_at, created_at)
            VALUES (r.access_key, r.id, coalesce(r.name, 'User'), r.phone_number, true, NOW(), NOW())
            ON CONFLICT (key) DO UPDATE SET
                user_id = r.id,
                user_name = coalesce(r.name, 'User'),
                is_active = true,
                activated_at = coalesce(public.access_keys.activated_at, NOW());
        END IF;
    END LOOP;
END $$;

-- 7. TAMPILKAN HASILNYA: DAFTAR USER LAMA DENGAN 11-DIGIT KEY MASING-MASING
SELECT 
    p.id AS user_id,
    p.name AS user_name,
    p.access_key,
    p.phone_number,
    k.is_active,
    k.activated_at
FROM public.profiles p
LEFT JOIN public.access_keys k ON p.access_key = k.key
ORDER BY p.created_at ASC;
