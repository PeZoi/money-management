-- =====================================================
-- MIGRATION: Tạo bảng report_configs
-- Lưu cấu hình bảng báo cáo tuỳ biến theo workspace + tháng
-- =====================================================

create table if not exists public.report_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month text not null,  -- Định dạng "YYYY-MM"
  tables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

comment on table public.report_configs is 'Custom report table layouts per workspace and month';

-- Tự động cập nhật updated_at khi thay đổi
drop trigger if exists trg_report_configs_updated_at on public.report_configs;
create trigger trg_report_configs_updated_at
before update on public.report_configs
for each row execute procedure public.set_updated_at();

-- Index tối ưu tra cứu theo workspace
create index if not exists idx_report_configs_workspace on public.report_configs(workspace_id);
create index if not exists idx_report_configs_workspace_month on public.report_configs(workspace_id, month);

-- RLS
alter table public.report_configs enable row level security;

drop policy if exists "report_configs access" on public.report_configs;
create policy "report_configs access"
on public.report_configs
for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
