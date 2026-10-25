-- =========================================================================
-- MONEYFLOW PRO - MIGRATION COLLABORATION, WORKSPACE & AUDIT TRAIL
-- Jalankan script ini di Supabase SQL Editor pada project kamu.
-- =========================================================================

-- 1. Enable UUID extension jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL WORKSPACES (Ruang Kolaborasi Finansial)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'couple', 'family')),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_workspaces_invite_code ON public.workspaces (UPPER(invite_code));
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces (owner_id);

-- 3. TABEL WORKSPACE_MEMBERS (Anggota dan Hak Akses Peran)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members (workspace_id);

-- 4. UPDATE TABEL WALLETS
-- Tambah relasi ke workspace dan opsi dompet privat
ALTER TABLE public.wallets 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_wallets_workspace_id ON public.wallets (workspace_id);

-- 5. UPDATE TABEL TRANSACTIONS
-- Tambah audit trail (siapa pembuat, di workspace mana, multi foto struk)
ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by_name TEXT,
    ADD COLUMN IF NOT EXISTS receipt_urls TEXT[];

CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON public.transactions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions (created_by_id);

-- 6. UPDATE TABEL DEBTS
-- Mendukung riwayat cicilan JSON dan bunga/angsuran
ALTER TABLE public.debts 
    ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS last_payment_date DATE,
    ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS installment_amount NUMERIC DEFAULT 0;

-- 7. UPDATE TABEL NOTIFICATIONS
-- Mendukung tipe aksi undangan (joint_invite)
ALTER TABLE public.notifications 
    ADD COLUMN IF NOT EXISTS action_type TEXT;

-- =========================================================================
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES UNTUK WORKSPACES
-- =========================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces: User dapat melihat workspace miliknya atau di mana dia menjadi member
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
CREATE POLICY "Users can view workspaces they are members of"
    ON public.workspaces FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = public.workspaces.id AND wm.user_id = auth.uid()
        )
    );

-- Workspaces: Pemilik akun terdaftar dapat membuat workspace baru
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Workspaces: Hanya owner yang dapat mengubah/menghapus workspace
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Owners can update their workspaces"
    ON public.workspaces FOR UPDATE
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete their workspaces"
    ON public.workspaces FOR DELETE
    USING (owner_id = auth.uid());

-- Workspace Members: Anggota bisa melihat member satu workspace
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
CREATE POLICY "Users can view members of their workspaces"
    ON public.workspace_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = public.workspace_members.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.workspace_members wm2
                WHERE wm2.workspace_id = w.id AND wm2.user_id = auth.uid()
            ))
        )
    );

-- Workspace Members: User bisa join atau owner bisa add member
DROP POLICY IF EXISTS "Users can join or owners can add members" ON public.workspace_members;
CREATE POLICY "Users can join or owners can add members"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = public.workspace_members.workspace_id AND w.owner_id = auth.uid()
        )
    );

-- Workspace Members: Hanya owner workspace yang dapat update role
DROP POLICY IF EXISTS "Only workspace owners can update member roles" ON public.workspace_members;
CREATE POLICY "Only workspace owners can update member roles"
    ON public.workspace_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = public.workspace_members.workspace_id AND w.owner_id = auth.uid()
        )
    );

-- Workspace Members: User bisa leave, atau owner bisa kick
DROP POLICY IF EXISTS "Members can leave or owners can remove members" ON public.workspace_members;
CREATE POLICY "Members can leave or owners can remove members"
    ON public.workspace_members FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = public.workspace_members.workspace_id AND w.owner_id = auth.uid()
        )
    );

-- Wallets & Transactions: Akses kolaborator ke data workspace bersama
DROP POLICY IF EXISTS "Users can view wallets in their workspaces" ON public.wallets;
CREATE POLICY "Users can view wallets in their workspaces"
    ON public.wallets FOR SELECT
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = public.wallets.workspace_id AND wm.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can view transactions in their workspaces" ON public.transactions;
CREATE POLICY "Users can view transactions in their workspaces"
    ON public.transactions FOR SELECT
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = public.transactions.workspace_id AND wm.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Members can insert transactions into their workspaces" ON public.transactions;
CREATE POLICY "Members can insert transactions into their workspaces"
    ON public.transactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = public.transactions.workspace_id 
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'editor')
        ))
    );

-- =========================================================================
-- 9. TRIGGER OTOMATIS SAAT USER BARU DAFTAR (SIGN UP)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()
RETURNS TRIGGER AS $$
DECLARE
    new_ws_id UUID;
    clean_name TEXT;
    inv_code TEXT;
BEGIN
    clean_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Pengguna MoneyFlow');
    inv_code := 'INV-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 6));

    -- 1. Buat Profile
    INSERT INTO public.profiles (id, name, currency, monthly_salary, financial_target)
    VALUES (NEW.id, clean_name, 'IDR', 0, 0)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- 2. Buat Settings
    INSERT INTO public.user_settings (user_id, theme, notifications_enabled, low_balance_threshold)
    VALUES (NEW.id, 'light', true, 500000)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Buat Ruang Pribadi (Personal Workspace)
    INSERT INTO public.workspaces (name, type, owner_id, invite_code)
    VALUES ('Ruang Pribadi', 'personal', NEW.id, inv_code)
    RETURNING id INTO new_ws_id;

    -- 4. Masukkan user sebagai Owner di workspace tersebut
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_ws_id, NEW.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_provisioning();
