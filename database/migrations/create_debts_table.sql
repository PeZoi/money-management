-- =====================================================
-- TABLE: debts (QUẢN LÝ NGƯỜI NỢ)
-- =====================================================

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  debtor_name text not null,
  amount numeric(14, 0) not null check (amount >= 0),
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  note text,
  notified boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.debts is 'Quản lý danh sách người nợ và hạn trả';

-- Index để tối ưu hiệu năng
create index if not exists idx_debts_workspace on public.debts(workspace_id);
create index if not exists idx_debts_due_at on public.debts(due_at);
create index if not exists idx_debts_status on public.debts(status);

-- Kích hoạt Row Level Security (RLS)
alter table public.debts enable row level security;

-- RLS POLICIES
drop policy if exists "view debts" on public.debts;
create policy "view debts"
on public.debts
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "insert debts" on public.debts;
create policy "insert debts"
on public.debts
for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists "update debts" on public.debts;
create policy "update debts"
on public.debts
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "delete debts" on public.debts;
create policy "delete debts"
on public.debts
for delete
using (public.is_workspace_member(workspace_id));

-- TRIGGER cập nhật updated_at tự động
drop trigger if exists trg_debts_updated_at on public.debts;
create trigger trg_debts_updated_at
before update on public.debts
for each row execute procedure public.set_updated_at();
