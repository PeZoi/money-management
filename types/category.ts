export type CategoryType = 'expense' | 'income';

export type CategoryUi = {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  created_at?: string;
  updated_at?: string;
};