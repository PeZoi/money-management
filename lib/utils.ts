import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MiniAccount {
  is_system: boolean;
  id?: string;
  balance?: number | string;
}

interface MiniTransaction {
  type: string;
  amount: number | string;
  account_id?: string | null;
  to_account_id?: string | null;
  account?: MiniAccount | null;
  to_account?: MiniAccount | null;
}

/**
 * Phân tích tác động dòng tiền của một giao dịch đối với hệ thống ví nội bộ.
 * Trả về loại tác động thực tế (income / expense / none) và số tiền tương ứng.
 */
export function getTransactionSystemImpact(
  t: MiniTransaction,
  accounts: MiniAccount[] = []
): { type: 'income' | 'expense' | 'none'; amount: number } {
  const amount = Number(t.amount || 0);
  if (isNaN(amount) || amount <= 0) return { type: 'none', amount: 0 };

  // Tìm thông tin is_system của account nguồn
  let fromIsSystem = true;
  if (t.account) {
    fromIsSystem = t.account.is_system;
  } else if (t.account_id && accounts.length > 0) {
    const acc = accounts.find((a) => a.id === t.account_id);
    if (acc) fromIsSystem = acc.is_system;
  }

  // Tìm thông tin is_system của account đích
  let toIsSystem = false;
  if (t.to_account) {
    toIsSystem = t.to_account.is_system;
  } else if (t.to_account_id && accounts.length > 0) {
    const acc = accounts.find((a) => a.id === t.to_account_id);
    if (acc) toIsSystem = acc.is_system;
  }

  if (t.type === 'income') {
    return fromIsSystem ? { type: 'income', amount } : { type: 'none', amount: 0 };
  }

  if (t.type === 'expense') {
    return fromIsSystem ? { type: 'expense', amount } : { type: 'none', amount: 0 };
  }

  if (t.type === 'transfer') {
    if (fromIsSystem && !toIsSystem) {
      // Ví trong hệ thống -> ví ngoài hệ thống = CHI TIÊU thực tế của hệ thống
      return { type: 'expense', amount };
    }
    if (!fromIsSystem && toIsSystem) {
      // Ví ngoài hệ thống -> ví trong hệ thống = THU NHẬP thực tế của hệ thống
      return { type: 'income', amount };
    }
  }

  return { type: 'none', amount: 0 };
}

