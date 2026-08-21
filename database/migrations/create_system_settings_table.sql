-- =====================================================
-- TABLE: system_settings (SYSTEM CONFIGURATION)
-- =====================================================

create table if not exists public.system_settings (
  key text primary key,
  value text not null default '',
  description text,
  is_secret boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.system_settings is 'Cấu hình hệ thống (AI provider, API keys, Cloudinary credentials, v.v.)';

-- Trigger updated_at
drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.system_settings enable row level security;

-- Policy: Only admin can select
drop policy if exists "Admin can view system settings" on public.system_settings;
create policy "Admin can view system settings"
on public.system_settings
for select
using (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);

-- Policy: Only admin can insert
drop policy if exists "Admin can insert system settings" on public.system_settings;
create policy "Admin can insert system settings"
on public.system_settings
for insert
with check (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);

-- Policy: Only admin can update
drop policy if exists "Admin can update system settings" on public.system_settings;
create policy "Admin can update system settings"
on public.system_settings
for update
using (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);

-- Policy: Only admin can delete
drop policy if exists "Admin can delete system settings" on public.system_settings;
create policy "Admin can delete system settings"
on public.system_settings
for delete
using (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);
