-- 1. Bổ sung các cột biệt danh và ngày sinh vào bảng love_connections
ALTER TABLE public.love_connections 
ADD COLUMN IF NOT EXISTS user_1_nickname text,
ADD COLUMN IF NOT EXISTS user_2_nickname text,
ADD COLUMN IF NOT EXISTS user_1_birthdate date,
ADD COLUMN IF NOT EXISTS user_2_birthdate date;

-- 2. Xóa hàm RPC cũ để cập nhật kiểu dữ liệu trả về mới
DROP FUNCTION IF EXISTS public.get_my_love_connection();

-- 3. Tạo lại hàm RPC trả về đầy đủ thông tin biệt danh và ngày sinh
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
  user_2_avatar_url text,
  user_1_nickname text,
  user_2_nickname text,
  user_1_birthdate date,
  user_2_birthdate date,
  partner_birthdate date
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
    -- Ưu tiên hiển thị biệt danh của partner nếu có
    COALESCE(
      CASE WHEN c.user_id_1 = auth.uid() THEN c.user_2_nickname ELSE c.user_1_nickname END,
      p.display_name
    ) AS partner_name,
    COALESCE(
      CASE WHEN c.user_id_1 = auth.uid() THEN c.user_2_avatar_url ELSE c.user_1_avatar_url END,
      p.avatar_url
    ) AS partner_avatar_url,
    p.email AS partner_email,
    c.anniversary_date,
    (CURRENT_DATE - c.anniversary_date)::integer AS days_together,
    c.background_url,
    c.user_1_avatar_url,
    c.user_2_avatar_url,
    c.user_1_nickname,
    c.user_2_nickname,
    c.user_1_birthdate,
    c.user_2_birthdate,
    -- Trả về ngày sinh của partner
    CASE WHEN c.user_id_1 = auth.uid() THEN c.user_2_birthdate ELSE c.user_1_birthdate END AS partner_birthdate
  FROM public.love_connections c
  JOIN partner_info p ON p.id = (CASE WHEN c.user_id_1 = auth.uid() THEN c.user_id_2 ELSE c.user_id_1 END)
  WHERE c.user_id_1 = auth.uid() OR c.user_id_2 = auth.uid();
END;
$$;
