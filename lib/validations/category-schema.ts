import { z } from 'zod';

/**
 * Schema Zod cho form danh mục (Category)
 * Dùng chung cho cả tạo mới và cập nhật
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên danh mục'),
  type: z.enum(['expense', 'income']),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const DEFAULT_CATEGORY_COLOR = '#64748b';

export function isValidHex6(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// Giá trị mặc định cho form tạo mới
export const categoryDefaultValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  icon: 'Tag',
  color: DEFAULT_CATEGORY_COLOR,
};
