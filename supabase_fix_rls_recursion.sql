-- =========================================================================
-- MONEYFLOW PRO - PERBAIKAN RLS INFINITE RECURSION
-- Jalankan script ini di Supabase SQL Editor untuk mengatasi:
-- "infinite recursion detected in policy for relation 'workspace_members'"
-- =========================================================================

-- 1. Helper Function SECURITY DEFINER
-- Fungsi ini mengecek hak akses tanpa memicu pengecekan RLS berulang (bebas rekursi)
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

-- 2. Bersihkan policy lama yang memicu recursive loop
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join or owners can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Only workspace owners can update member roles" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can leave or owners can remove members" ON public.workspace_members;

DROP POLICY IF EXISTS "Users can view wallets in their workspaces" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update wallets" ON public.wallets;

DROP POLICY IF EXISTS "Users can view transactions in their workspaces" ON public.transactions;
DROP POLICY IF EXISTS "Members can insert transactions into their workspaces" ON public.transactions;

-- 3. Pasang Kebijakan Baru yang Aman (Non-Recursive)

-- WORKSPACES
CREATE POLICY "Users can view workspaces they are members of"
    ON public.workspaces FOR SELECT
    USING (
        owner_id = auth.uid() OR
        public.check_is_workspace_member(id, auth.uid())
    );

CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their workspaces"
    ON public.workspaces FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
    ON public.workspaces FOR DELETE
    USING (owner_id = auth.uid());

-- WORKSPACE_MEMBERS
CREATE POLICY "Users can view members of their workspaces"
    ON public.workspace_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        public.check_is_workspace_owner(workspace_id, auth.uid()) OR
        public.check_is_workspace_member(workspace_id, auth.uid())
    );

CREATE POLICY "Users can join or owners can add members"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        public.check_is_workspace_owner(workspace_id, auth.uid())
    );

CREATE POLICY "Only workspace owners can update member roles"
    ON public.workspace_members FOR UPDATE
    USING (
        public.check_is_workspace_owner(workspace_id, auth.uid())
    );

CREATE POLICY "Members can leave or owners can remove members"
    ON public.workspace_members FOR DELETE
    USING (
        user_id = auth.uid() OR
        public.check_is_workspace_owner(workspace_id, auth.uid())
    );

-- WALLETS (Mendukung dompet personal dan dompet kolaborasi workspace)
CREATE POLICY "Users can view wallets in their workspaces"
    ON public.wallets FOR SELECT
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_member(workspace_id, auth.uid()))
    );

CREATE POLICY "Users can insert wallets"
    ON public.wallets FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_member(workspace_id, auth.uid()))
    );

CREATE POLICY "Users can update wallets"
    ON public.wallets FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_member(workspace_id, auth.uid()))
    );

-- TRANSACTIONS (Mendukung transaksi personal dan kolaborasi)
CREATE POLICY "Users can view transactions in their workspaces"
    ON public.transactions FOR SELECT
    USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_member(workspace_id, auth.uid()))
    );

CREATE POLICY "Members can insert transactions into their workspaces"
    ON public.transactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND public.check_is_workspace_member(workspace_id, auth.uid()))
    );
