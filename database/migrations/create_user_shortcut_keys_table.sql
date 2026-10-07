-- =====================================================
-- BẢNG LƯU API KEY CHO APPLE SHORTCUTS (IOS AUTOMATION)
-- =====================================================

create table if not exists public.user_shortcut_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  api_key text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_shortcut_keys is 'Lưu API Key bí mật cho từng người dùng để đồng bộ giao dịch từ iOS Shortcuts';

-- Bật Row Level Security (RLS)
alter table public.user_shortcut_keys enable row level security;

-- Policies
drop policy if exists "Users can view their own shortcut key" on public.user_shortcut_keys;
create policy "Users can view their own shortcut key"
on public.user_shortcut_keys
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own shortcut key" on public.user_shortcut_keys;
create policy "Users can insert their own shortcut key"
on public.user_shortcut_keys
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own shortcut key" on public.user_shortcut_keys;
create policy "Users can update their own shortcut key"
on public.user_shortcut_keys
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own shortcut key" on public.user_shortcut_keys;
create policy "Users can delete their own shortcut key"
on public.user_shortcut_keys
for delete
using (user_id = auth.uid());
