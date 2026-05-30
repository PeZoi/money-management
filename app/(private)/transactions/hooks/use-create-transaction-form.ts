import { useEffect, useState, useCallback } from 'react';
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
import { parseTransactionOnline } from '@/lib/utils/transaction-parser';
import { getLocalStorageItem } from '@/functions/localstorage-fn';
import { SETTINGS_KEY } from '@/functions/localstorage-fn';
import { toast } from 'sonner';

export type CreateDialogTab = 'auto' | 'manual';

type UseCreateTransactionFormOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Hook quản lý toàn bộ logic form tạo giao dịch mới
 * Hỗ trợ 2 tab: Tự động (AI + Regex) và Thủ công
 */
export function useCreateTransactionForm({ onOpenChange, onSuccess }: UseCreateTransactionFormOptions) {
  const { categories } = useCategories();
  const { isSubmitting, createTransaction } = useTransactionMutation();
  const { accounts, activeAccount } = useAccounts();

  // === Tab State ===
  const [activeTab, setActiveTab] = useState<CreateDialogTab>('auto');

  // === Auto Tab State ===
  const [autoNote, setAutoNote] = useState('');
  const [autoAccountId, setAutoAccountId] = useState('');
  const [autoDate, setAutoDate] = useState<Date>(new Date());
  const [isParsing, setIsParsing] = useState(false);


  // === Manual Tab Form (React Hook Form) ===
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

  // Tự động gán active account cho auto tab
  useEffect(() => {
    if (activeAccount && !autoAccountId) {
      setAutoAccountId(activeAccount.id);
    }
  }, [activeAccount, autoAccountId]);

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
    // Reset auto tab
    setAutoNote('');
    setAutoAccountId(activeAccount?.id ?? '');
    setAutoDate(new Date());
    setActiveTab('auto');
    setIsParsing(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  // === Logic xử lý Submit tab Tự động ===
  const handleAutoSubmit = useCallback(async () => {
    if (!autoNote.trim()) {
      toast.error('Vui lòng nhập mô tả giao dịch');
      return;
    }

    if (!autoAccountId) {
      toast.error('Vui lòng chọn tài khoản');
      return;
    }

    setIsParsing(true);

    try {
      const categoryInfos = categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));

      // Phân tích giao dịch hoàn toàn bằng AI (Gemini)
      const parsed = await parseTransactionOnline(autoNote, categoryInfos);

      // Đọc cài đặt preview từ localStorage
      const previewSetting = getLocalStorageItem(SETTINGS_KEY.SMART_TX_PREVIEW);
      // Mặc định bật preview (true) nếu chưa từng cấu hình
      const previewEnabled = previewSetting === null ? true : previewSetting === 'true';

      if (previewEnabled) {
        // === PREVIEW MODE: Điền dữ liệu vào form thủ công rồi chuyển tab ===
        form.setValue('type', parsed.type);
        form.setValue('note', parsed.cleanNote);
        form.setValue('accountId', autoAccountId);
        form.setValue('date', autoDate);

        // Set số tiền (format dạng hiển thị)
        if (parsed.amount && parsed.amount > 0) {
          form.setValue('amount', formatAmountInput(String(parsed.amount)));
        }

        // Set danh mục nếu tìm thấy, ngược lại reset về rỗng để hiển thị dưới dạng "Khác" trên UI
        if (parsed.categorySuggestion) {
          const matchedCat = categories.find(
            (c) => c.name === parsed.categorySuggestion && c.type === parsed.type,
          );
          if (matchedCat) {
            form.setValue('categoryId', matchedCat.id);
          } else {
            form.setValue('categoryId', '');
          }
        } else {
          form.setValue('categoryId', '');
        }

        // Chuyển sang tab thủ công để xem lại
        setActiveTab('manual');
        toast.info('Đã nhận dạng xong! Hãy kiểm tra lại thông tin trước khi lưu.', {
          duration: 3000,
        });
      } else {
        // === DIRECT MODE: Lưu trực tiếp không cần preview ===
        const numAmt = parsed.amount || 0;
        if (numAmt <= 0) {
          // Không nhận dạng được số tiền → chuyển sang manual
          form.setValue('type', parsed.type);
          form.setValue('note', parsed.cleanNote);
          form.setValue('accountId', autoAccountId);
          form.setValue('date', autoDate);
          setActiveTab('manual');
          toast.warning('Không nhận dạng được số tiền. Vui lòng nhập thủ công.', {
            duration: 3000,
          });
          return;
        }

        // Tìm danh mục ID
        let categoryIdForSave: string | null = null;
        if (parsed.categorySuggestion) {
          const matchedCat = categories.find(
            (c) => c.name === parsed.categorySuggestion && c.type === parsed.type,
          );
          if (matchedCat) categoryIdForSave = matchedCat.id;
        }

        // Tránh lệch múi giờ
        const now = new Date();
        const formattedCreatedAt = new Date(
          autoDate.getFullYear(),
          autoDate.getMonth(),
          autoDate.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
        ).toISOString();

        await createTransaction(
          {
            amount: numAmt,
            type: parsed.type,
            category_id: categoryIdForSave,
            note: parsed.cleanNote || null,
            created_at: formattedCreatedAt,
            account_id: autoAccountId,
          },
          {
            onSuccess: () => {
              onSuccess?.();
              handleClose(false);
            },
          },
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi phân tích giao dịch';
      toast.error(message);
    } finally {
      setIsParsing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNote, autoAccountId, autoDate, categories, form, createTransaction, onSuccess]);

  // === Logic Submit tab Thủ công (giữ nguyên logic cũ) ===
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
    // Tab state
    activeTab,
    setActiveTab,

    // Auto tab state
    autoNote,
    setAutoNote,
    autoAccountId,
    setAutoAccountId,
    autoDate,
    setAutoDate,
    isParsing,
    handleAutoSubmit,

    // Manual tab state (existing)
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
