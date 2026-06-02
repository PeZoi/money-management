-- ALTER TABLE: user_telegram_connections
-- Thêm các cột lưu họ tên hiển thị và đường dẫn ảnh đại diện Telegram của người dùng

alter table public.user_telegram_connections
  add column if not exists telegram_display_name text,
  add column if not exists telegram_avatar_path text;

comment on column public.user_telegram_connections.telegram_display_name is 'Họ tên hiển thị lấy từ tài khoản Telegram (First Name + Last Name)';
comment on column public.user_telegram_connections.telegram_avatar_path is 'Đường dẫn file ảnh đại diện trên máy chủ Telegram để proxy tải về';
