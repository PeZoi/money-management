-- =====================================================
-- MIGRATION: Add Love Customization (Avatars & Background)
-- =====================================================

-- 1. Thêm các cột lưu URL ảnh avatar và hình nền tùy chỉnh
ALTER TABLE public.love_connections 
ADD COLUMN IF NOT EXISTS user_1_avatar_url text,
ADD COLUMN IF NOT EXISTS user_2_avatar_url text,
ADD COLUMN IF NOT EXISTS background_url text;

-- 2. Cập nhật hàm RPC get_my_love_connection để trả về các cột mới này
CREATE OR REPLACE FUNCTION public.get_my_love_connection()
RETURNS TABLE (
  connection_id uuid,
  partner_id uuid,
  partner_name text,
  partner_avatar_url text,
  partner_email text,
  anniversary_date date,
  days_together integer,
  background_url text,
  user_1_avatar_url text,
  user_2_avatar_url text
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
    -- Trả về avatar tùy chỉnh của partner nếu có, ngược lại dùng avatar mặc định của tài khoản partner
    COALESCE(
      CASE WHEN c.user_id_1 = auth.uid() THEN c.user_2_avatar_url ELSE c.user_1_avatar_url END,
      p.avatar_url
    ) AS partner_avatar_url,
    p.email AS partner_email,
    c.anniversary_date,
    (CURRENT_DATE - c.anniversary_date)::integer AS days_together,
    c.background_url,
    c.user_1_avatar_url,
    c.user_2_avatar_url
  FROM public.love_connections c
  JOIN partner_info p ON p.id = (CASE WHEN c.user_id_1 = auth.uid() THEN c.user_id_2 ELSE c.user_id_1 END)
  WHERE c.user_id_1 = auth.uid() OR c.user_id_2 = auth.uid();
END;
$$;
