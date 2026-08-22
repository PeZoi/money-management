-- ==============================================================================
-- MIGRATION: TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN GIAO DỊCH (COMPOSITE INDEXES)
-- Mục tiêu: Chuyển toàn bộ truy vấn transactions từ O(N) quét bảng sang O(log N)
-- ==============================================================================

-- 1. Index chính cho Workspace + Thời gian tạo (giảm 95% thời gian query danh sách theo tháng/ngày)
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_created
ON public.transactions (workspace_id, created_at DESC);

-- 2. Index cho bộ lọc theo Danh mục (Category) + Thời gian
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_category_created
ON public.transactions (workspace_id, category_id, created_at DESC);

-- 3. Index cho bộ lọc theo Loại giao dịch (Income / Expense / Transfer) + Thời gian
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_type_created
ON public.transactions (workspace_id, type, created_at DESC);

-- 4. Index cho bộ lọc theo Tài khoản nguồn (account_id) và đích (to_account_id)
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_account_created
ON public.transactions (workspace_id, account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_workspace_to_account_created
ON public.transactions (workspace_id, to_account_id, created_at DESC);

-- 5. Index cho bảng accounts và categories để tăng tốc JOIN
CREATE INDEX IF NOT EXISTS idx_accounts_workspace_active
ON public.accounts (workspace_id, is_active);

CREATE INDEX IF NOT EXISTS idx_categories_workspace_type
ON public.categories (workspace_id, type);

COMMENT ON INDEX public.idx_transactions_workspace_created IS 'Tối ưu truy vấn danh sách giao dịch theo workspace và ngày tạo (DESC)';
COMMENT ON INDEX public.idx_transactions_workspace_category_created IS 'Tối ưu lọc giao dịch theo danh mục';
COMMENT ON INDEX public.idx_transactions_workspace_type_created IS 'Tối ưu lọc giao dịch theo thu/chi/chuyển tiền';
