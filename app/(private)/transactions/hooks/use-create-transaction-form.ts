import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useTransactionMutation } from '@/hooks/use-transactions';
import {
  formatAmountInput,
  parseAmount,
  transactionDefaultValues,
  transactionSchema,
  type TransactionFormValues,
} from '@/lib/validations/transaction-schema';
import type { TransactionType } from '@/types/database';

type UseCreateTransactionFormOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Hook quản lý toàn bộ logic form tạo giao dịch mới
 * Sử dụng React Hook Form + Zod validation
 */
export function useCreateTransactionForm({ onOpenChange, onSuccess }: UseCreateTransactionFormOptions) {
  const { categories } = useCategories();
  const { isSubmitting, createTransaction } = useTransactionMutation();
  const { accounts, activeAccount } = useAccounts();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transactionDefaultValues,
    mode: 'onChange',
  });

  // Watch các giá trị cần thiết cho UI
  // eslint-disable-next-line react-hooks/incompatible-library
  const type = form.watch('type');
  const accountId = form.watch('accountId');
  const toAccountId = form.watch('toAccountId');
  const amount = form.watch('amount');
  const categoryId = form.watch('categoryId');

  const isTransfer = type === 'transfer';
  const filteredCategories = categories.filter((c) => c.type === type);
  const numAmount = parseAmount(amount);

  // Tự động gán active account làm mặc định khi load xong dữ liệu tài khoản
  useEffect(() => {
    if (activeAccount && !accountId) {
      form.setValue('accountId', activeAccount.id);
    }
  }, [activeAccount, accountId, form]);

  // Hàm helper lấy class CSS cho danh mục dựa vào loại giao dịch
  const getCategoryClasses = (isSelected: boolean) => {
    if (!isSelected) {
      return {
        button: 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
        iconSpan: 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
      };
    }
    if (type === 'expense') {
      return {
        button: 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/20',
        iconSpan: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
      };
    }
    if (type === 'income') {
      return {
        button:
          'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20',
        iconSpan: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      };
    }
    return {
      button: 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20',
      iconSpan: 'border-primary/20 bg-primary/10 text-primary',
    };
  };

  const getSourcePreviewData = () => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return null;
    const curBalance = Number(acc.balance);
    const nextBalance = type === 'income' ? curBalance + numAmount : curBalance - numAmount;
    return {
      curBalance,
      nextBalance,
    };
  };

  const getDestPreviewData = () => {
    const acc = accounts.find((a) => a.id === toAccountId);
    if (!acc) return null;
    const curBalance = Number(acc.balance);
    const nextBalance = curBalance + numAmount;
    return {
      curBalance,
      nextBalance,
    };
  };

  const resetForm = () => {
    form.reset({
      ...transactionDefaultValues,
      accountId: activeAccount?.id ?? '',
      date: new Date(),
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };


  const onSubmit = async (data: TransactionFormValues) => {
    const numAmt = parseAmount(data.amount);
    if (!numAmt || numAmt <= 0) return;

    // Tránh lệch múi giờ, đồng thời lấy chính xác giờ phút giây hiện tại
    const now = new Date();
    let formattedCreatedAt: string | null = null;
    if (data.date) {
      formattedCreatedAt = new Date(
        data.date.getFullYear(),
        data.date.getMonth(),
        data.date.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      ).toISOString();
    }

    const txType = data.type as TransactionType;
    const txIsTransfer = txType === 'transfer';

    const ok = await createTransaction(
      {
        amount: numAmt,
        type: txType,
        category_id: txIsTransfer ? null : data.categoryId || null,
        note: data.note?.trim() || null,
        created_at: formattedCreatedAt,
        account_id: data.accountId || activeAccount?.id || null,
        to_account_id: txIsTransfer ? data.toAccountId || null : null,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose(false);
        },
      },
    );
    if (!ok) return;
  };

  const isDuplicateTransfer = isTransfer && accountId && toAccountId && accountId === toAccountId;

  const isValid =
    parseAmount(amount) > 0 && (isTransfer ? accountId && toAccountId && !isDuplicateTransfer : accountId);

  // Setter helpers để đảm bảo format đúng
  const setType = (newType: TransactionType) => {
    form.setValue('type', newType);
    form.setValue('categoryId', '');
  };

  const setAmount = (raw: string) => {
    form.setValue('amount', formatAmountInput(raw));
  };

  return {
    form,
    type,
    accountId,
    toAccountId,
    amount,
    categoryId,
    isTransfer,
    filteredCategories,
    numAmount,
    isDuplicateTransfer,
    isValid,
    isSubmitting,
    accounts,
    activeAccount,
    setType,
    setAmount,
    handleClose,
    onSubmit: form.handleSubmit(onSubmit),
    getCategoryClasses,
    sourcePreviewData: getSourcePreviewData(),
    destPreviewData: getDestPreviewData(),
  };
}
