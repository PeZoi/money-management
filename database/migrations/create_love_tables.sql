-- =====================================================
-- MIGRATION: Create Love Connections & Milestones Tables
-- =====================================================

-- 1. Bảng lưu trữ kết nối tình yêu giữa 2 users
CREATE TABLE IF NOT EXISTS public.love_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anniversary_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_different_users CHECK (user_id_1 != user_id_2),
  CONSTRAINT unique_user_1 UNIQUE (user_id_1),
  CONSTRAINT unique_user_2 UNIQUE (user_id_2)
);

-- Trigger đảm bảo tính duy nhất chéo (cross-exclusivity)
-- Một user chỉ được phép có mặt ở tối đa 1 connection (ở vị trí user_id_1 hoặc user_id_2)
CREATE OR REPLACE FUNCTION public.check_user_love_exclusivity()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.love_connections
    WHERE (user_id_1 = NEW.user_id_1 OR user_id_2 = NEW.user_id_1)
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'User 1 đã được bắt cặp trong một kết nối khác.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.love_connections
    WHERE (user_id_1 = NEW.user_id_2 OR user_id_2 = NEW.user_id_2)
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'User 2 đã được bắt cặp trong một kết nối khác.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_love_connections_exclusivity ON public.love_connections;
CREATE TRIGGER trg_love_connections_exclusivity
BEFORE INSERT OR UPDATE ON public.love_connections
FOR EACH ROW EXECUTE PROCEDURE public.check_user_love_exclusivity();

DROP TRIGGER IF EXISTS trg_love_connections_updated_at ON public.love_connections;
CREATE TRIGGER trg_love_connections_updated_at
BEFORE UPDATE ON public.love_connections
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 2. Bảng lưu trữ cột mốc kỷ niệm tình yêu
CREATE TABLE IF NOT EXISTS public.love_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.love_connections(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  milestone_date date NOT NULL,
  icon text DEFAULT 'Heart',
  image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_love_milestones_updated_at ON public.love_milestones;
CREATE TRIGGER trg_love_milestones_updated_at
BEFORE UPDATE ON public.love_milestones
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Bật Row Level Security (RLS)
ALTER TABLE public.love_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_milestones ENABLE ROW LEVEL SECURITY;

-- CẤU HÌNH POLICIES CHO LOVE_CONNECTIONS
DROP POLICY IF EXISTS "view love connection" ON public.love_connections;
CREATE POLICY "view love connection"
ON public.love_connections FOR SELECT
USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin insert love connection" ON public.love_connections;
CREATE POLICY "admin insert love connection"
ON public.love_connections FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update love connection" ON public.love_connections;
CREATE POLICY "update love connection"
ON public.love_connections FOR UPDATE
USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin())
WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin delete love connection" ON public.love_connections;
CREATE POLICY "admin delete love connection"
ON public.love_connections FOR DELETE
USING (public.is_admin());

-- CẤU HÌNH POLICIES CHO LOVE_MILESTONES
DROP POLICY IF EXISTS "view love milestones" ON public.love_milestones;
CREATE POLICY "view love milestones"
ON public.love_milestones FOR SELECT
USING (
  connection_id IN (
    SELECT id FROM public.love_connections WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  ) OR public.is_admin()
);

DROP POLICY IF EXISTS "insert love milestones" ON public.love_milestones;
CREATE POLICY "insert love milestones"
ON public.love_milestones FOR INSERT
WITH CHECK (
  connection_id IN (
    SELECT id FROM public.love_connections WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  ) AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "update love milestones" ON public.love_milestones;
CREATE POLICY "update love milestones"
ON public.love_milestones FOR UPDATE
USING (
  connection_id IN (
    SELECT id FROM public.love_connections WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  )
)
WITH CHECK (
  connection_id IN (
    SELECT id FROM public.love_connections WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete love milestones" ON public.love_milestones;
CREATE POLICY "delete love milestones"
ON public.love_milestones FOR DELETE
USING (
  connection_id IN (
    SELECT id FROM public.love_connections WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  )
);

-- 3. HÀM RPC ĐỂ ADMIN TRUY VẤN TRẠNG THÁI BẮT CẶP CỦA TẤT CẢ USER
CREATE OR REPLACE FUNCTION public.get_users_love_status()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  partner_id uuid,
  partner_name text,
  anniversary_date date,
  connection_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: Admin role required';
  END IF;

  RETURN QUERY
  WITH user_list AS (
    SELECT
      u.id,
      u.email::text AS email,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      )::text AS display_name,
      (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url
    FROM auth.users u
  )
  SELECT
    ul.id,
    ul.email,
    ul.display_name,
    ul.avatar_url,
    p.id AS partner_id,
    p.display_name AS partner_name,
    c.anniversary_date,
    c.id AS connection_id
  FROM user_list ul
  LEFT JOIN public.love_connections c ON (c.user_id_1 = ul.id OR c.user_id_2 = ul.id)
  LEFT JOIN user_list p ON p.id = (CASE WHEN c.user_id_1 = ul.id THEN c.user_id_2 ELSE c.user_id_1 END)
  ORDER BY ul.display_name ASC;
END;
$$;

-- 4. HÀM RPC CHO USER TRUY VẤN KẾT NỐI TÌNH YÊU CỦA MÌNH
CREATE OR REPLACE FUNCTION public.get_my_love_connection()
RETURNS TABLE (
  connection_id uuid,
  partner_id uuid,
  partner_name text,
  partner_avatar_url text,
  partner_email text,
  anniversary_date date,
  days_together integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  WITH partner_info AS (
    SELECT
      u.id,
      u.email::text AS email,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      )::text AS display_name,
      (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url
    FROM auth.users u
  )
  SELECT
    c.id AS connection_id,
    p.id AS partner_id,
    p.display_name AS partner_name,
    p.avatar_url AS partner_avatar_url,
    p.email AS partner_email,
    c.anniversary_date,
    (CURRENT_DATE - c.anniversary_date)::integer AS days_together
  FROM public.love_connections c
  JOIN partner_info p ON p.id = (CASE WHEN c.user_id_1 = auth.uid() THEN c.user_id_2 ELSE c.user_id_1 END)
  WHERE c.user_id_1 = auth.uid() OR c.user_id_2 = auth.uid();
END;
$$;
