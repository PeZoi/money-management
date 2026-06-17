-- Migration: Thêm giá trị 'savings' vào enum account_type
-- Loại Tiết kiệm: luôn thuộc hệ thống (is_system=true)
-- Chuyển tiền vào tài khoản Tiết kiệm = chuyển nội bộ hệ thống, KHÔNG tính là Chi tiêu

ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'savings';

COMMENT ON TYPE public.account_type IS
  'Loại tài khoản: cash | bank | e_wallet | savings | investment | other. '
  'Loại savings (Tiết kiệm) luôn thuộc hệ thống (is_system=true); '
  'chuyển tiền vào savings không tính là chi tiêu mà là chuyển nội bộ hệ thống.';
