-- =====================================================
-- MIGRATION: Tạo RPC handle_workspace_settlement phục vụ tất toán và giải tán nhóm
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_workspace_settlement(
  p_workspace_id uuid,
  p_user_id uuid,
  p_settle_up boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_group_name text;
  v_members_count int;
  v_share numeric;
  v_remainder numeric;
  v_amount numeric;
  r_acc RECORD;
  r_member RECORD;
  v_personal_ws_id uuid;
  v_personal_acc_id uuid;
  v_balance numeric;
BEGIN
  -- 1. Kiểm tra vai trò của user hiện tại trong workspace (chỉ Owner mới được giải tán)
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Chỉ chủ nhóm mới có quyền giải tán nhóm.';
  END IF;

  -- Lấy tên nhóm
  SELECT name INTO v_group_name FROM public.workspaces WHERE id = p_workspace_id;

  -- 2. Thực hiện tất toán nếu được yêu cầu
  IF p_settle_up THEN
    -- Đếm số lượng thành viên
    SELECT COUNT(*) INTO v_members_count 
    FROM public.workspace_members 
    WHERE workspace_id = p_workspace_id;

    IF v_members_count > 0 THEN
      -- Lặp qua các tài khoản có số dư > 0
      FOR r_acc IN (
        SELECT id, name, balance 
        FROM public.accounts 
        WHERE workspace_id = p_workspace_id AND balance > 0
      ) LOOP
        v_balance := r_acc.balance;
        v_share := floor(v_balance / v_members_count);
        v_remainder := v_balance % v_members_count;

        -- Lặp qua từng thành viên để chia tiền
        FOR r_member IN (
          SELECT wm.user_id, wm.role,
            COALESCE(
              u.raw_user_meta_data->>'full_name',
              u.raw_user_meta_data->>'name',
              split_part(u.email, '@', 1)
            )::text AS display_name,
            u.email::text AS email
          FROM public.workspace_members wm
          JOIN auth.users u ON u.id = wm.user_id
          WHERE wm.workspace_id = p_workspace_id
        ) LOOP
          -- Chủ nhóm nhận phần dư lẻ
          IF r_member.role = 'owner' THEN
            v_amount := v_share + v_remainder;
          ELSE
            v_amount := v_share;
          END IF;

          IF v_amount > 0 THEN
            -- A. Tạo giao dịch Chi (Expense) ở Group Workspace
            INSERT INTO public.transactions (
              workspace_id,
              amount,
              type,
              account_id,
              note,
              created_by
            ) VALUES (
              p_workspace_id,
              v_amount,
              'expense',
              r_acc.id,
              'Tất toán quỹ chia cho thành viên ' || r_member.display_name || ' (' || r_member.email || ')',
              p_user_id
            );

            -- B. Tìm Workspace cá nhân của thành viên đó
            SELECT w.id INTO v_personal_ws_id 
            FROM public.workspaces w
            WHERE w.created_by = r_member.user_id AND w.is_personal = true
            LIMIT 1;

            IF v_personal_ws_id IS NOT NULL THEN
              -- Tìm tài khoản active trong Workspace cá nhân đó
              SELECT a.id INTO v_personal_acc_id
              FROM public.accounts a
              WHERE a.workspace_id = v_personal_ws_id AND a.is_active = true
              ORDER BY a.created_at ASC
              LIMIT 1;

              -- Nếu không có tài khoản active, tìm tài khoản bất kỳ
              IF v_personal_acc_id IS NULL THEN
                SELECT a.id INTO v_personal_acc_id
                FROM public.accounts a
                WHERE a.workspace_id = v_personal_ws_id
                ORDER BY a.created_at ASC
                LIMIT 1;
              END IF;

              IF v_personal_acc_id IS NOT NULL THEN
                -- Tạo giao dịch Thu (Income) ở Personal Workspace của thành viên
                INSERT INTO public.transactions (
                  workspace_id,
                  amount,
                  type,
                  account_id,
                  note,
                  created_by
                ) VALUES (
                  v_personal_ws_id,
                  v_amount,
                  'income',
                  v_personal_acc_id,
                  'Tất toán (' || v_group_name || ')',
                  r_member.user_id
                );
              END IF;
            END IF;
          END IF;
        END LOOP;
      END LOOP;
    END IF;
  END IF;

  -- 3. Cập nhật trạng thái lưu trữ của workspace
  UPDATE public.workspaces
  SET is_archived = true
  WHERE id = p_workspace_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Giải tán và tất toán nhóm thành công.'
  );
END;
$$;
