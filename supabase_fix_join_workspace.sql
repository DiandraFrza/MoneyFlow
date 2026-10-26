-- =========================================================================
-- MONEYFLOW PRO - PERBAIKAN GABUNG WORKSPACE DENGAN KODE (JOIN FIX)
-- Jalankan script ini di Supabase SQL Editor.
-- Script ini memungkinkan user non-member mencari ruang dengan kode undangan
-- dan bergabung secara langsung dan aman (SECURITY DEFINER).
-- =========================================================================

-- 1. Perbarui policy SELECT pada tabel workspaces
-- Izinkan melihat workspace jika:
-- a) User adalah pemilik (owner)
-- b) User adalah anggota (member)
-- c) ATAU workspace memiliki invite_code (sehingga bisa dicari dengan kode undangan)
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

CREATE POLICY "Users can view workspaces they are members of or by invite code"
    ON public.workspaces FOR SELECT
    USING (
        owner_id = auth.uid() OR
        public.check_is_workspace_member(id, auth.uid()) OR
        invite_code IS NOT NULL
    );

-- 2. Fungsi RPC Gabung Workspace Secara Aman (SECURITY DEFINER)
-- Fungsi ini mencari ruang berdasarkan kode dan langsung mendaftarkan user sebagai editor.
CREATE OR REPLACE FUNCTION public.join_workspace_by_code(p_code TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ws record;
    v_user_id uuid := auth.uid();
    v_clean_code text := UPPER(TRIM(p_code));
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sesi tidak valid / belum login');
    END IF;

    -- Cari ruang berdasarkan invite_code
    SELECT id, name, type, owner_id, invite_code INTO v_ws
    FROM public.workspaces
    WHERE UPPER(TRIM(invite_code)) = v_clean_code
    LIMIT 1;

    IF v_ws.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Kode undangan tidak ditemukan');
    END IF;

    -- Jika user adalah pemilik ruang, tidak perlu tambah ke workspace_members
    IF v_ws.owner_id = v_user_id THEN
        RETURN json_build_object(
            'success', true,
            'workspace_id', v_ws.id,
            'name', v_ws.name,
            'type', v_ws.type,
            'role', 'owner',
            'is_owner', true
        );
    END IF;

    -- Daftarkan user ke workspace_members sebagai editor (jika belum ada)
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_ws.id, v_user_id, 'editor')
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET role = EXCLUDED.role;

    RETURN json_build_object(
        'success', true,
        'workspace_id', v_ws.id,
        'name', v_ws.name,
        'type', v_ws.type,
        'role', 'editor',
        'is_owner', false
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_workspace_by_code(TEXT) TO authenticated;

