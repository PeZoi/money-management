export type CategoryType = 'expense' | 'income';

export type CategoryUi = {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  color?: string;
  colorHint: 'emerald' | 'violet' | 'amber' | 'sky' | 'rose' | 'slate';
};