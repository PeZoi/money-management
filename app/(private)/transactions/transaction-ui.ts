import type { TransactionType } from '@/types/database';

export function normalizeText(s: string) {
  try {
    return s
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

export function typeLabel(t: TransactionType) {
  return t === 'income' ? 'Thu nhập' : 'Chi tiêu';
}

export function typeBadgeClass(t: TransactionType) {
  return t === 'income'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400';
}

export function typeAmountClass(t: TransactionType) {
  return t === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
}

export function typeAmountPrefix(t: TransactionType) {
  return t === 'income' ? '+' : '-';
}

/**
 * Format số tiền VND
 * Ví dụ: 1500000 → "1.500.000 ₫"
 */
export function formatVnd(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return '0 ₫';
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Format ngày ngắn gọn
 * Ví dụ: "18/05/2026 16:00"
 */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
