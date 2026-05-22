-- Xóa hàm cũ trước vì kiểu trả về (signature) thay đổi
DROP FUNCTION IF EXISTS public.get_workspace_member_details(uuid);

-- Tạo lại hàm mới bổ sung cột status
CREATE OR REPLACE FUNCTION public.get_workspace_member_details(ws_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role public.workspace_role,
  email text,
  display_name text,
  avatar_url text,
  status text
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
    (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
    wm.status
  FROM public.workspace_members wm
  JOIN auth.users u ON u.id = wm.user_id
  WHERE wm.workspace_id = ws_id;
END;
$$;
