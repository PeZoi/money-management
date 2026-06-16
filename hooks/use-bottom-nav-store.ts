import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LayoutDashboardIcon,
  CreditCardIcon,
  WalletIcon,
  TagsIcon,
  SettingsIcon,
  ChartPieIcon,
  HeartIcon,
  UsersIcon
} from 'lucide-react';
import * as React from 'react';

export type NavItemKey =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'settings'
  | 'reports'
  | 'love'
  | 'debts';

export interface NavItemInfo {
  key: NavItemKey;
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

export const ALL_NAV_ITEMS: Record<NavItemKey, NavItemInfo> = {
  dashboard: {
    key: 'dashboard',
    title: 'Dashboard',
    label: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
  },
  accounts: {
    key: 'accounts',
    title: 'Tài khoản',
    label: 'Tài khoản ví',
    url: '/accounts',
    icon: CreditCardIcon,
  },
  transactions: {
    key: 'transactions',
    title: 'Giao dịch',
    label: 'Giao dịch',
    url: '/transactions',
    icon: WalletIcon,
  },
  categories: {
    key: 'categories',
    title: 'Danh mục',
    label: 'Danh mục chi tiêu',
    url: '/categories',
    icon: TagsIcon,
  },
  settings: {
    key: 'settings',
    title: 'Cài đặt',
    label: 'Cài đặt hệ thống',
    url: '/settings',
    icon: SettingsIcon,
  },
  reports: {
    key: 'reports',
    title: 'Báo cáo',
    label: 'Báo cáo phân tích',
    url: '/reports',
    icon: ChartPieIcon,
  },
  love: {
    key: 'love',
    title: 'Ngày bên nhau',
    label: 'Ngày bên nhau',
    url: '/love',
    icon: HeartIcon,
  },
  debts: {
    key: 'debts',
    title: 'Quản lý nợ',
    label: 'Quản lý nợ',
    url: '/debts',
    icon: UsersIcon,
  },
};

type BottomNavState = {
  items: NavItemKey[];
  setItems: (items: NavItemKey[]) => void;
  updateItemAt: (index: number, key: NavItemKey) => void;
  resetToDefault: () => void;
};

const DEFAULT_ITEMS: NavItemKey[] = [
  'dashboard',
  'accounts',
  'transactions',
  'categories',
  'settings',
];

export const useBottomNavStore = create<BottomNavState>()(
  persist(
    (set) => ({
      items: DEFAULT_ITEMS,
      setItems: (items) => set({ items }),
      updateItemAt: (index, key) =>
        set((state) => {
          const newItems = [...state.items];
          newItems[index] = key;
          return { items: newItems };
        }),
      resetToDefault: () => set({ items: DEFAULT_ITEMS }),
    }),
    {
      name: 'bottom-nav-storage',
    }
  )
);
