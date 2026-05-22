-- =====================================================
-- MIGRATION: Tạo RPC handle_fund_contribution phục vụ đóng quỹ nhóm
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_fund_contribution(
  p_personal_workspace_id uuid,
  p_personal_account_id uuid,
  p_group_workspace_id uuid,
  p_group_account_id uuid,
  p_amount numeric,
  p_note text,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
declare
  v_personal_tx_id uuid;
  v_group_tx_id uuid;
  v_personal_ws_member boolean;
  v_group_ws_member boolean;
  v_personal_ws_name text;
  v_group_ws_name text;
  v_personal_acc_name text;
  v_group_acc_name text;
  v_user_name text;
begin
  -- 1. Check member permissions
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_personal_workspace_id and user_id = p_user_id
  ) into v_personal_ws_member;

  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_group_workspace_id and user_id = p_user_id
  ) into v_group_ws_member;

  if not v_personal_ws_member or not v_group_ws_member then
    raise exception 'User không phải là thành viên của một trong hai workspace.';
  end if;

  -- 2. Check accounts belong to correct workspaces & get names
  select name into v_personal_acc_name from public.accounts 
  where id = p_personal_account_id and workspace_id = p_personal_workspace_id;
  
  if v_personal_acc_name is null then
    raise exception 'Tài khoản nguồn không thuộc workspace cá nhân đã chọn.';
  end if;

  select name into v_group_acc_name from public.accounts 
  where id = p_group_account_id and workspace_id = p_group_workspace_id;
  
  if v_group_acc_name is null then
    raise exception 'Tài khoản đích không thuộc workspace nhóm đã chọn.';
  end if;

  -- Get workspace names for custom notes
  select name into v_personal_ws_name from public.workspaces where id = p_personal_workspace_id;
  select name into v_group_ws_name from public.workspaces where id = p_group_workspace_id;

  -- Get user display name for group workspace transaction note
  select coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  )::text into v_user_name
  from auth.users u
  where u.id = p_user_id;

  -- 3. Check workspace group is not archived
  if exists (
    select 1 from public.workspaces where id = p_group_workspace_id and is_archived = true
  ) then
    raise exception 'Workspace nhóm này đã giải tán, không thể nộp quỹ.';
  end if;

  -- 4. Insert expense transaction for personal workspace
  insert into public.transactions (
    workspace_id,
    amount,
    type,
    category_id,
    account_id,
    to_account_id,
    note,
    created_by
  ) values (
    p_personal_workspace_id,
    p_amount,
    'expense',
    null,
    p_personal_account_id,
    null,
    coalesce(p_note, 'Đóng quỹ nhóm') || ' (' || v_group_ws_name || ')',
    p_user_id
  ) returning id into v_personal_tx_id;

  -- 5. Insert income transaction for group workspace
  insert into public.transactions (
    workspace_id,
    amount,
    type,
    category_id,
    account_id,
    to_account_id,
    note,
    created_by
  ) values (
    p_group_workspace_id,
    p_amount,
    'income',
    null,
    p_group_account_id,
    null,
    coalesce(p_note, 'Nhận quỹ đóng góp từ ' || v_personal_acc_name) || ' (' || coalesce(v_user_name, 'Thành viên') || ')',
    p_user_id
  ) returning id into v_group_tx_id;

  return json_build_object(
    'success', true,
    'personal_transaction_id', v_personal_tx_id,
    'group_transaction_id', v_group_tx_id
  );
end;
$$;
