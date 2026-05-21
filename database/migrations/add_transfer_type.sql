-- =====================================================
-- MIGRATION: Thêm loại giao dịch "transfer" (Chuyển tiền)
-- LƯU Ý: Phải chạy làm 2 bước riêng biệt trong Postgres/Supabase SQL Editor.
-- =====================================================

-- BƯỚC 1: Chạy câu lệnh dưới đây riêng biệt trước để commit enum value
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'transfer';

-- BƯỚC 2: Chạy các câu lệnh còn lại dưới đây
-- 2. Thêm cột to_account_id (tài khoản đích khi chuyển tiền)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 3. Index cho to_account_id
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON public.transactions(to_account_id);

-- 4. Constraint: Nếu type = 'transfer' thì account_id bắt buộc phải có
-- (Xóa constraint cũ nếu tồn tại trước khi tạo mới)
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS chk_transfer_needs_account;

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transfer_needs_account
  CHECK (type <> 'transfer' OR account_id IS NOT NULL);

-- 5. Constraint: Không cho chuyển tiền vào chính tài khoản nguồn
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS chk_transfer_diff_accounts;

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transfer_diff_accounts
  CHECK (to_account_id IS NULL OR to_account_id <> account_id);

-- 6. Cập nhật function sync_account_balance để xử lý transfer
CREATE OR REPLACE FUNCTION public.sync_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- === DELETE: Hoàn lại balance ===
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' THEN
        -- Hoàn lại: cộng tiền về tài khoản nguồn
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        -- Hoàn lại: trừ tiền từ tài khoản đích (nếu có)
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
        END IF;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- === INSERT: Áp dụng tác động mới ===
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        -- Trừ tiền tài khoản nguồn
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        -- Cộng tiền tài khoản đích (nếu có, nếu NULL = rút tiền mặt)
        IF NEW.to_account_id IS NOT NULL THEN
          UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- === UPDATE: Hoàn tác OLD rồi áp dụng NEW ===
  IF TG_OP = 'UPDATE' THEN
    -- Hoàn tác tác động cũ (OLD)
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
        END IF;
      END IF;
    END IF;

    -- Áp dụng tác động mới (NEW)
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        IF NEW.to_account_id IS NOT NULL THEN
          UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- 7. Tạo lại trigger (DROP + CREATE để đảm bảo function mới được áp dụng)
DROP TRIGGER IF EXISTS trg_sync_account_balance ON public.transactions;
CREATE TRIGGER trg_sync_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_account_balance();

-- =====================================================
-- END MIGRATION
-- =====================================================
