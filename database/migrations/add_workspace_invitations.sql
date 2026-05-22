-- =====================================================
-- MIGRATION: Thêm hệ thống lời mời (invitations) vào workspace_members
-- =====================================================

-- 1. Thêm cột status vào workspace_members nếu chưa có
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

-- 2. Cập nhật hàm kiểm tra thành viên is_workspace_member
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'accepted'
  );
$$;

-- 3. Cập nhật hàm kiểm tra quản trị viên is_workspace_admin
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'accepted'
  );
$$;

-- 4. Cập nhật hàm kiểm tra chủ nhóm is_workspace_owner
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
      AND wm.status = 'accepted'
  );
$$;

-- 5. Cập nhật hàm mời thành viên add_workspace_member_by_email để đặt status = 'pending'
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
    RAISE EXCEPTION 'Người dùng này đã được mời hoặc đã là thành viên của nhóm.';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (ws_id, target_user_id, member_role, 'pending')
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$;

-- 6. Tạo hàm get_my_workspace_invitations để lấy danh sách lời mời của user hiện tại
CREATE OR REPLACE FUNCTION public.get_my_workspace_invitations()
RETURNS TABLE (
  invitation_id uuid,
  workspace_id uuid,
  workspace_name text,
  invited_by_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.id AS invitation_id,
    w.id AS workspace_id,
    w.name::text AS workspace_name,
    u.email::text AS invited_by_email,
    wm.created_at
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  JOIN auth.users u ON u.id = w.created_by
  WHERE wm.user_id = auth.uid()
    AND wm.status = 'pending';
END;
$$;

-- 7. Tạo hàm accept_workspace_invitation để chấp nhận lời mời
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(inv_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workspace_members
  SET status = 'accepted', updated_at = now()
  WHERE id = inv_id AND user_id = auth.uid() AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- 8. Tạo hàm decline_workspace_invitation để từ chối lời mời
CREATE OR REPLACE FUNCTION public.decline_workspace_invitation(inv_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.workspace_members
  WHERE id = inv_id AND user_id = auth.uid() AND status = 'pending';
  
  RETURN FOUND;
END;
$$;
