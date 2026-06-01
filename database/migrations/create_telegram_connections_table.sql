-- =====================================================
-- EXPENSE MANAGEMENT APP - TELEGRAM CONNECTION SCHEMA
-- =====================================================

create table if not exists public.user_telegram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id bigint unique,
  telegram_username text,
  connection_token uuid default gen_random_uuid(),
  token_expires_at timestamptz not null default (now() + interval '10 minutes'),
  is_auto_backup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_telegram_connections is 'Manages Telegram Bot connections and backup configurations per user';

-- Bật Row Level Security (RLS)
alter table public.user_telegram_connections enable row level security;

-- Policies: Cho phép người dùng truy cập dữ liệu của chính mình
drop policy if exists "Users can view their own telegram connection" on public.user_telegram_connections;
create policy "Users can view their own telegram connection"
on public.user_telegram_connections
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own telegram connection" on public.user_telegram_connections;
create policy "Users can insert their own telegram connection"
on public.user_telegram_connections
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own telegram connection" on public.user_telegram_connections;
create policy "Users can update their own telegram connection"
on public.user_telegram_connections
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own telegram connection" on public.user_telegram_connections;
create policy "Users can delete their own telegram connection"
on public.user_telegram_connections
for delete
using (user_id = auth.uid());

-- Trigger tự động cập nhật updated_at
drop trigger if exists trg_user_telegram_connections_updated_at on public.user_telegram_connections;
create trigger trg_user_telegram_connections_updated_at
before update on public.user_telegram_connections
for each row execute procedure public.set_updated_at();
