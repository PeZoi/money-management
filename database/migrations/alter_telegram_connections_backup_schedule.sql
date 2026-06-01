-- =====================================================
-- ALTER TABLE: user_telegram_connections
-- Add customizable backup schedule columns
-- =====================================================

-- Thêm cột tần suất sao lưu (daily, weekly, monthly)
alter table public.user_telegram_connections
add column if not exists backup_interval text default 'weekly'
check (backup_interval in ('daily', 'weekly', 'monthly'));

-- Thêm cột ngày sao lưu (1-7 cho weekly đại diện Thứ 2-CN, hoặc 1-31 cho monthly)
alter table public.user_telegram_connections
add column if not exists backup_day integer default 1
check (backup_day >= 1 and backup_day <= 31);

-- Thêm cột giờ sao lưu (0-23)
alter table public.user_telegram_connections
add column if not exists backup_hour integer default 0
check (backup_hour >= 0 and backup_hour <= 23);
