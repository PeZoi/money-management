import { CategoryType } from "@/types/category";

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

export function typeLabel(t: CategoryType) {
  return t === 'income' ? 'Thu nhập' : 'Chi tiêu';
}

export function typeBadgeClass(t: CategoryType) {
  return t === 'income'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300';
}
