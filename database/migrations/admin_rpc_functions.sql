-- =====================================================
-- MIGRATION: Admin RPC Functions
-- Tạo các hàm SECURITY DEFINER để admin truy vấn
-- dữ liệu cross-schema (auth.users, public.*)
-- =====================================================

-- 1. Thống kê tổng quan hệ thống
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  total_workspaces bigint,
  total_transactions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin của người gọi
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM auth.users)::bigint AS total_users,
    (SELECT count(*) FROM public.workspaces)::bigint AS total_workspaces,
    (SELECT count(*) FROM public.transactions)::bigint AS total_transactions;
END;
$$;

-- 2. Danh sách tất cả users kèm role hệ thống
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  system_role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin của người gọi
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::text AS display_name,
    (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
    COALESCE(ur.role::text, 'user') AS system_role,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 3. Danh sách tất cả workspaces cho admin (bypass RLS)
DROP FUNCTION IF EXISTS public.get_all_workspaces_for_admin();
CREATE OR REPLACE FUNCTION public.get_all_workspaces_for_admin()
RETURNS TABLE (
  id uuid,
  name text,
  is_personal boolean,
  is_archived boolean,
  created_by uuid,
  owner_email text,
  owner_display_name text,
  owner_avatar_url text,
  member_count bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin của người gọi
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.is_personal,
    w.is_archived,
    w.created_by,
    creator.email::text AS owner_email,
    COALESCE(
      creator.raw_user_meta_data->>'full_name',
      creator.raw_user_meta_data->>'name',
      split_part(creator.email, '@', 1)
    )::text AS owner_display_name,
    (creator.raw_user_meta_data->>'avatar_url')::text AS owner_avatar_url,
    (SELECT count(*) FROM public.workspace_members wm WHERE wm.workspace_id = w.id)::bigint AS member_count,
    w.created_at
  FROM public.workspaces w
  LEFT JOIN auth.users creator ON creator.id = w.created_by
  ORDER BY w.created_at DESC;
END;
$$;

-- 4. Tạo hàm helper is_admin() để kiểm tra quyền admin tránh đệ quy RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 5. Cập nhật RLS cho user_roles: cho phép admin đọc tất cả
DROP POLICY IF EXISTS "view own role" ON public.user_roles;
CREATE POLICY "view own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_view_all_roles" ON public.user_roles;
CREATE POLICY "admin_view_all_roles"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

-- Cho phép admin cập nhật role của users khác
DROP POLICY IF EXISTS "admin_update_roles" ON public.user_roles;
CREATE POLICY "admin_update_roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Cho phép admin insert role cho users mới
DROP POLICY IF EXISTS "admin_insert_roles" ON public.user_roles;
CREATE POLICY "admin_insert_roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- 6. HÀM PHÂN TÍCH THỐNG KÊ CHO ADMIN DASHBOARD
-- =====================================================

-- 6.1. Tăng trưởng người dùng và workspace theo ngày (30 ngày qua)
CREATE OR REPLACE FUNCTION public.get_admin_growth_analytics()
RETURNS TABLE (
  date text,
  new_users bigint,
  new_workspaces bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      date_trunc('day', now() - interval '29 days'),
      date_trunc('day', now()),
      interval '1 day'
    )::date AS date_val
  ),
  user_counts AS (
    SELECT date_trunc('day', created_at)::date AS date_val, count(*) AS count_val
    FROM auth.users
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  ),
  workspace_counts AS (
    SELECT date_trunc('day', created_at)::date AS date_val, count(*) AS count_val
    FROM public.workspaces
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  )
  SELECT 
    to_char(ds.date_val, 'YYYY-MM-DD')::text AS date,
    COALESCE(uc.count_val, 0)::bigint AS new_users,
    COALESCE(wc.count_val, 0)::bigint AS new_workspaces
  FROM date_series ds
  LEFT JOIN user_counts uc ON ds.date_val = uc.date_val
  LEFT JOIN workspace_counts wc ON ds.date_val = wc.date_val
  ORDER BY ds.date_val ASC;
END;
$$;

-- 6.2. Phân bố loại hình Workspace (Cá nhân vs Nhóm)
CREATE OR REPLACE FUNCTION public.get_admin_workspace_composition()
RETURNS TABLE (
  personal_count bigint,
  group_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    count(CASE WHEN is_personal = true THEN 1 END)::bigint AS personal_count,
    count(CASE WHEN is_personal = false THEN 1 END)::bigint AS group_count
  FROM public.workspaces;
END;
$$;

-- 6.3. Nhật ký hoạt động hệ thống thực tế gần đây (7 hoạt động mới nhất)
CREATE OR REPLACE FUNCTION public.get_admin_recent_activities()
RETURNS TABLE (
  activity_type text,
  target_name text,
  actor_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  (
    -- Đăng ký tài khoản mới
    SELECT 
      'user_signup'::text AS activity_type,
      u.email::text AS target_name,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      )::text AS actor_name,
      u.created_at
    FROM auth.users u
    ORDER BY u.created_at DESC
    LIMIT 5
  )
  UNION ALL
  (
    -- Tạo workspace mới
    SELECT
      'workspace_create'::text AS activity_type,
      w.name::text AS target_name,
      COALESCE(
        creator.raw_user_meta_data->>'full_name',
        creator.raw_user_meta_data->>'name',
        split_part(creator.email, '@', 1)
      )::text AS actor_name,
      w.created_at
    FROM public.workspaces w
    LEFT JOIN auth.users creator ON creator.id = w.created_by
    ORDER BY w.created_at DESC
    LIMIT 5
  )
  UNION ALL
  (
    -- Giao dịch mới phát sinh
    SELECT
      'transaction_create'::text AS activity_type,
      t.amount::text AS target_name,
      COALESCE(
        creator.raw_user_meta_data->>'full_name',
        creator.raw_user_meta_data->>'name',
        split_part(creator.email, '@', 1)
      )::text AS actor_name,
      t.created_at
    FROM public.transactions t
    LEFT JOIN auth.users creator ON creator.id = t.created_by
    ORDER BY t.created_at DESC
    LIMIT 5
  )
  ORDER BY created_at DESC
  LIMIT 7;
END;
$$;

-- 6.4. Lấy kích thước thực tế của database PostgreSQL (bytes)
CREATE OR REPLACE FUNCTION public.get_admin_system_health()
RETURNS TABLE (
  db_size_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  SELECT pg_database_size(current_database())::bigint AS db_size_bytes;
END;
$$;
