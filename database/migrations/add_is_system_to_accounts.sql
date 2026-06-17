-- Migration: Bổ sung cột is_system vào bảng accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.accounts.is_system IS 'Xác định tài khoản có nằm trong hệ thống tính toán chính hay không';
