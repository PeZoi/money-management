-- =====================================================
-- EXPENSE MANAGEMENT APP - FULL SCHEMA (SINGLE FILE)
-- Compatible with Supabase (PostgreSQL)
-- =====================================================

-- EXTENSIONS
create extension if not exists "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- System roles
create type user_role as enum ('user', 'admin');

-- Workspace roles
create type workspace_role as enum ('owner', 'admin', 'member');

-- Transaction types
create type transaction_type as enum ('expense', 'income');

-- =====================================================
-- COMMON UTILITIES
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- TABLE: user_roles (SYSTEM LEVEL PERMISSION)
-- =====================================================

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_roles_updated_at on public.user_roles;
create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row execute procedure public.set_updated_at();

-- =====================================================
-- TABLE: workspaces (PERSONAL + GROUP)
-- =====================================================

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_personal boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspaces is 'Workspace for personal or group expense tracking';

drop trigger if exists trg_workspaces_updated_at on public.workspaces;
create trigger trg_workspaces_updated_at
before update on public.workspaces
for each row execute procedure public.set_updated_at();

-- =====================================================
-- TABLE: workspace_members (ROLE IN WORKSPACE)
-- =====================================================

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

comment on table public.workspace_members is 'Members and roles inside workspace';

drop trigger if exists trg_workspace_members_updated_at on public.workspace_members;
create trigger trg_workspace_members_updated_at
before update on public.workspace_members
for each row execute procedure public.set_updated_at();

-- =====================================================
-- TABLE: categories
-- =====================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null default '#64748b',
  type transaction_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, type, name)
);

comment on table public.categories is 'Expense/Income categories per workspace';

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

-- =====================================================
-- TABLE: transactions
-- =====================================================

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  amount numeric(14, 0) not null check (amount > 0),
  type transaction_type not null,
  category_id uuid references public.categories(id) on delete set null,
  note text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'Financial transactions';

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute procedure public.set_updated_at();

-- =====================================================
-- INDEXES (PERFORMANCE)
-- =====================================================

create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index idx_transactions_workspace on public.transactions(workspace_id);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_transactions_category on public.transactions(category_id);
create index idx_transactions_created_by on public.transactions(created_by);
create index idx_categories_workspace on public.categories(workspace_id);
create index idx_categories_workspace_type on public.categories(workspace_id, type);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

alter table public.user_roles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- =====================================================
-- HELPER FUNCTION
-- =====================================================

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = ws_id
    and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  );
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- WORKSPACES
drop policy if exists "view own workspaces" on public.workspaces;
create policy "view own workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "create workspace" on public.workspaces;
create policy "create workspace"
on public.workspaces
for insert
with check (created_by = auth.uid());

drop policy if exists "update workspace (admin)" on public.workspaces;
create policy "update workspace (admin)"
on public.workspaces
for update
using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

drop policy if exists "delete workspace (owner)" on public.workspaces;
create policy "delete workspace (owner)"
on public.workspaces
for delete
using (public.is_workspace_owner(id));

-- WORKSPACE MEMBERS
drop policy if exists "view workspace members" on public.workspace_members;
create policy "view workspace members"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "manage workspace members (admin)" on public.workspace_members;
create policy "manage workspace members (admin)"
on public.workspace_members
for insert
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "update workspace members (admin)" on public.workspace_members;
create policy "update workspace members (admin)"
on public.workspace_members
for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "delete workspace members (admin)" on public.workspace_members;
create policy "delete workspace members (admin)"
on public.workspace_members
for delete
using (public.is_workspace_admin(workspace_id));

-- CATEGORIES
drop policy if exists "categories access" on public.categories;
create policy "categories access"
on public.categories
for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

-- TRANSACTIONS
drop policy if exists "transactions select" on public.transactions;
create policy "transactions select"
on public.transactions
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "transactions insert" on public.transactions;
create policy "transactions insert"
on public.transactions
for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists "transactions update" on public.transactions;
create policy "transactions update"
on public.transactions
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "transactions delete" on public.transactions;
create policy "transactions delete"
on public.transactions
for delete
using (public.is_workspace_member(workspace_id));

-- USER ROLES (only self or admin can view)
drop policy if exists "view own role" on public.user_roles;
create policy "view own role"
on public.user_roles
for select
using (user_id = auth.uid());

-- =====================================================
-- AUTO CREATE PERSONAL WORKSPACE ON SIGNUP
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  -- Create personal workspace
  insert into public.workspaces (name, is_personal, created_by)
  values ('Cá nhân', true, new.id)
  returning id into ws_id;

  -- Add as owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  -- Assign default system role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =====================================================
-- END OF FILE
-- =====================================================
-- NOTE: accounts table and account_id in transactions
-- are added via Supabase migration: create_accounts_table
-- See: database/migrations/create_accounts_table.sql
