import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useTransactionMutation } from '@/hooks/use-transactions';
import {
  formatAmountInput,
  parseAmount,
  transactionSchema,
  type TransactionFormValues,
} from '@/lib/validations/transaction-schema';
import type { TransactionWithCategory } from '@/types/database';

type UseUpdateTransactionFormOptions = {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Hook quản lý toàn bộ logic form cập nhật giao dịch
 * Sử dụng React Hook Form + Zod validation
 */
export function useUpdateTransactionForm({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: UseUpdateTransactionFormOptions) {
  const { categories } = useCategories();
  const { isSubmitting, updateTransaction } = useTransactionMutation();
  const { accounts, activeAccount } = useAccounts();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      note: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      accountId: '',
      toAccountId: '',
      date: new Date(),
    },
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

  // Reset form khi transaction thay đổi hoặc modal được mở
  useEffect(() => {
    if (transaction) {
      form.reset({
        note: transaction.note || '',
        amount: formatAmountInput(transaction.amount.toString()),
        type: transaction.type,
        categoryId: transaction.category_id || '',
        accountId: transaction.account_id || '',
        toAccountId: transaction.to_account_id || '',
        date: transaction.created_at ? new Date(transaction.created_at) : new Date(),
      });
    }
  }, [transaction, open, form]);

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

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: TransactionFormValues) => {
    if (!transaction) return;
    const numAmt = parseAmount(data.amount);
    if (!numAmt || numAmt <= 0) return;

    const txIsTransfer = data.type === 'transfer';

    // Tránh lệch múi giờ, lấy chính xác giờ phút giây hiện tại
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

    const ok = await updateTransaction(
      transaction.id,
      {
        amount: numAmt,
        category_id: txIsTransfer ? null : data.categoryId || null,
        note: data.note?.trim() || null,
        created_at: formattedCreatedAt,
        account_id: data.accountId || null,
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

  // Setter helpers
  const setAmount = (raw: string) => {
    form.setValue('amount', formatAmountInput(raw));
  };

  return {
    form,
    // Dữ liệu đã watch
    type,
    accountId,
    toAccountId,
    amount,
    categoryId,
    isTransfer,
    filteredCategories,
    isDuplicateTransfer,
    isValid,
    isSubmitting,
    accounts,
    activeAccount,
    // Actions
    setAmount,
    handleClose,
    onSubmit: form.handleSubmit(onSubmit),
    getCategoryClasses,
  };
}
