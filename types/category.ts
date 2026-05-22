export type CategoryType = 'expense' | 'income';

export type CategoryUi = {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
};