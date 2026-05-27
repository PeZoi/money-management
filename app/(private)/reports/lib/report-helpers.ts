import type { ReportColumn } from '@/types/report';

// ─── Format số tiền VND ──────────────────────────────

export function formatVnd(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Lấy class màu sắc số tiền theo loại cột ────────

export function getColumnValueColorClass(col: ReportColumn, val: number): string {
  if (val === 0) return 'text-muted-foreground/40';

  if (col.kind === 'formula') {
    return 'text-foreground font-bold';
  }
  if (col.kind === 'system') {
    return 'text-foreground font-semibold';
  }
  return 'text-foreground';
}

// ─── Lấy class màu nền và icon cho chỉ số hệ thống ──

export function getSystemMetricIconClass(metric: string): string {
  switch (metric) {
    case 'month_balance':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'account_balance':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'total_income':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'total_expense':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
