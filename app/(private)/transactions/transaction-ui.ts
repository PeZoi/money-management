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
  if (t === 'income') return 'Thu nhập';
  if (t === 'transfer') return 'Chuyển tiền';
  return 'Chi tiêu';
}

export function typeBadgeClass(t: TransactionType) {
  if (t === 'income')
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (t === 'transfer')
    return 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400';
  return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400';
}

export function typeAmountClass(t: TransactionType) {
  if (t === 'income') return 'text-emerald-600 dark:text-emerald-400';
  if (t === 'transfer') return 'text-blue-600 dark:text-blue-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function typeAmountPrefix(t: TransactionType) {
  if (t === 'income') return '+';
  if (t === 'transfer') return '';
  return '-';
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
