-- =========================================================================
-- MONEYFLOW PRO - MIGRATION SPLIT BILL (PATUNGAN CEPAT)
-- Jalankan script ini di Supabase SQL Editor pada project kamu.
-- =========================================================================

-- 1. Enable UUID extension jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL SPLIT_BILLS (Pencatatan Patungan & Pembagian Tagihan)
CREATE TABLE IF NOT EXISTS public.split_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode TEXT NOT NULL DEFAULT 'equal' CHECK (mode IN ('equal', 'itemized')),
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax_percent NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    service_percent NUMERIC NOT NULL DEFAULT 0,
    service_amount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_info TEXT,
    target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index performa query
CREATE INDEX IF NOT EXISTS idx_split_bills_user_id ON public.split_bills (user_id);
CREATE INDEX IF NOT EXISTS idx_split_bills_workspace_id ON public.split_bills (workspace_id);
CREATE INDEX IF NOT EXISTS idx_split_bills_date ON public.split_bills (date DESC);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;

-- Helper check function check_is_workspace_member / check_is_workspace_owner
-- (Sudah dibuat di migration collab, dibuat ulang aman dengan CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.check_is_workspace_member(_ws_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _ws_id AND user_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.check_is_workspace_owner(_ws_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE id = _ws_id AND owner_id = _user_id
    );
$$;

-- Policy SELECT: Pembuat bill atau sesama anggota workspace kolaboratif
DROP POLICY IF EXISTS "Users can view their own split bills or workspace bills" ON public.split_bills;
CREATE POLICY "Users can view their own split bills or workspace bills"
    ON public.split_bills FOR SELECT
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND (
            public.check_is_workspace_owner(workspace_id, auth.uid()) OR
            public.check_is_workspace_member(workspace_id, auth.uid())
        ))
    );

-- Policy INSERT: User yang login membuat split bill
DROP POLICY IF EXISTS "Users can create split bills" ON public.split_bills;
CREATE POLICY "Users can create split bills"
    ON public.split_bills FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );

-- Policy UPDATE: Pembuat atau anggota workspace (misal update checklist lunas per orang)
DROP POLICY IF EXISTS "Users or workspace members can update split bills" ON public.split_bills;
CREATE POLICY "Users or workspace members can update split bills"
    ON public.split_bills FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND (
            public.check_is_workspace_owner(workspace_id, auth.uid()) OR
            public.check_is_workspace_member(workspace_id, auth.uid())
        ))
    );

-- Policy DELETE: Hanya pembuat atau pemilik workspace yang boleh menghapus
DROP POLICY IF EXISTS "Owners can delete split bills" ON public.split_bills;
CREATE POLICY "Owners can delete split bills"
    ON public.split_bills FOR DELETE
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_owner(workspace_id, auth.uid()))
    );

-- 4. GRANT PERMISSIONS
GRANT ALL ON public.split_bills TO authenticated;
GRANT ALL ON public.split_bills TO service_role;
