import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useAccountMutation } from '@/hooks/use-accounts';
import {
  accountDefaultValues,
  accountSchema,
  type AccountFormValues,
} from '@/lib/validations/account-schema';
import type { AccountRow } from '@/types/database';

type UseAccountFormOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountRow | null;
  onSuccess?: () => void;
};

/**
 * Định dạng số tiền sang hiển thị dạng phân tách hàng nghìn (ví dụ: 100,000 hoặc -100,000)
 */
function formatAmountInput(val: string | number): string {
  const str = String(val);
  // Lấy ra dấu trừ nếu có ở đầu để hỗ trợ tài khoản ghi nợ (số dư âm)
  const isNegative = str.startsWith('-');
  const clean = str.replace(/[^0-9]/g, '');
  if (!clean) return isNegative ? '-' : '';
  const formatted = Number(clean).toLocaleString('en-US');
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Hook quản lý toàn bộ logic form tài khoản (tạo mới / cập nhật)
 * Sử dụng React Hook Form + Zod validation
 */
export function useAccountForm({ open, onOpenChange, account, onSuccess }: UseAccountFormOptions) {
  const isUpdate = !!account;
  const { isSubmitting, createAccount, updateAccount } = useAccountMutation();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          balance: formatAmountInput(account.balance),
          icon: account.icon,
          color: account.color,
          is_system: account.is_system ?? true,
        }
      : accountDefaultValues,
    mode: 'onChange',
  });

  // Reset form khi dialog được mở (theo dõi prop `open` và `account`)
  useEffect(() => {
    if (open) {
      form.reset(
        account
          ? {
              name: account.name,
              type: account.type,
              balance: formatAmountInput(account.balance),
              icon: account.icon,
              color: account.color,
              is_system: account.is_system ?? true,
            }
          : accountDefaultValues,
      );
    }
  }, [open, account, form]);

  // Khi chọn loại Tiết kiệm, bắt buộc is_system = true
  // vì tài khoản tiết kiệm luôn thuộc hệ thống để tổng tài sản chính xác
  const currentType = form.watch('type');
  useEffect(() => {
    if (currentType === 'savings') {
      form.setValue('is_system', true);
    }
  }, [currentType, form]);

  const onSubmit = async (data: AccountFormValues) => {
    const payload = {
      name: data.name.trim(),
      type: data.type,
      balance: Number(data.balance.replace(/[^0-9-]/g, '')) || 0,
      icon: data.icon,
      color: data.color,
      is_system: data.is_system,
    };

    let ok = false;
    if (isUpdate && account) {
      ok = await updateAccount(account.id, payload, { onSuccess });
    } else {
      ok = await createAccount(payload, { onSuccess });
    }
    if (ok) onOpenChange(false);
  };

  /**
   * Cập nhật giá trị balance với format hiển thị
   */
  const setFormattedBalance = (raw: string) => {
    form.setValue('balance', formatAmountInput(raw), { shouldValidate: true });
  };

  return {
    form,
    isUpdate,
    isSubmitting,
    isSavingsType: currentType === 'savings',
    onSubmit: form.handleSubmit(onSubmit),
    setFormattedBalance,
    formatAmountInput,
  };
}
