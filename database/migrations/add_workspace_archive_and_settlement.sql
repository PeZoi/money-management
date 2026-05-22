-- =====================================================
-- MIGRATION: Thêm cột is_archived vào workspaces và cập nhật RLS cho workspace_members
-- =====================================================

-- 1. Thêm cột is_archived vào workspaces
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- 2. Tạo index cho is_archived để tối ưu query
CREATE INDEX IF NOT EXISTS idx_workspaces_is_archived ON public.workspaces(is_archived);

-- 3. Cập nhật RLS policy cho workspace_members (DELETE)
-- Thay vì cho phép admin/owner xóa, chỉ cho phép OWNER của workspace hoặc chính USER đó tự rời nhóm (tự delete)
DROP POLICY IF EXISTS "delete workspace members (admin)" ON public.workspace_members;

CREATE POLICY "delete workspace members (owner_or_self)"
  ON public.workspace_members
  FOR DELETE
  USING (
    public.is_workspace_owner(workspace_id) -- Chỉ owner mới có quyền kick
    OR user_id = auth.uid() -- Hoặc chính thành viên tự rời nhóm
  );

-- 4. Hàm lấy chi tiết thông tin thành viên (bypass RLS auth.users)
CREATE OR REPLACE FUNCTION public.get_workspace_member_details(ws_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role public.workspace_role,
  email text,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_workspace_member(ws_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    wm.id AS member_id,
    wm.user_id,
    wm.role,
    u.email::text,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::text AS display_name,
    (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url
  FROM public.workspace_members wm
  JOIN auth.users u ON u.id = wm.user_id
  WHERE wm.workspace_id = ws_id;
END;
$$;

-- 5. Hàm thêm thành viên bằng email (bypass RLS auth.users)
CREATE OR REPLACE FUNCTION public.add_workspace_member_by_email(ws_id uuid, member_email text, member_role public.workspace_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  new_member_id uuid;
END;
$$;
CREATE OR REPLACE FUNCTION public.add_workspace_member_by_email(ws_id uuid, member_email text, member_role public.workspace_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  new_member_id uuid;
BEGIN
  IF NOT public.is_workspace_admin(ws_id) THEN
    RAISE EXCEPTION 'Chỉ quản trị viên hoặc chủ nhóm mới được mời thành viên.';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = member_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người dùng với email này. Hãy chắc chắn họ đã đăng ký tài khoản.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Người dùng này đã là thành viên của nhóm.';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, target_user_id, member_role)
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$;
