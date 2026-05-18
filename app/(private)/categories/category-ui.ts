import { CategoryType, CategoryUi } from "@/types/category";

const FALLBACK_HEX = '#64748b';

export function categoryCardAccentStyle(hex: string | undefined): { backgroundImage: string } {
  const raw = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : FALLBACK_HEX;
  const r = Number.parseInt(raw.slice(1, 3), 16);
  const g = Number.parseInt(raw.slice(3, 5), 16);
  const b = Number.parseInt(raw.slice(5, 7), 16);
  return {
    backgroundImage: `linear-gradient(to bottom right, rgba(${r},${g},${b},0.16), rgba(${r},${g},${b},0)`,
  };
}

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

export function accentClass(h: CategoryUi['colorHint']) {
  switch (h) {
    case 'emerald':
      return 'from-emerald-500/12 to-emerald-500/0';
    case 'violet':
      return 'from-violet-500/12 to-violet-500/0';
    case 'amber':
      return 'from-amber-500/14 to-amber-500/0';
    case 'sky':
      return 'from-sky-500/12 to-sky-500/0';
    case 'rose':
      return 'from-rose-500/12 to-rose-500/0';
    default:
      return 'from-slate-500/10 to-slate-500/0';
  }
}
