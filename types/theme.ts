export const THEME_PRIMARY_STORAGE_KEY = "moneyplus.theme.primary" as const;

export interface AppThemePreference {
  /** Màu CSS hợp lệ, thực tế đang lưu hex trong localStorage */
  primary: string;
}
