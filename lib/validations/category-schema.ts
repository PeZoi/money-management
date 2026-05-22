import { z } from 'zod';

/**
 * Schema Zod cho form danh mục (Category)
 * Dùng chung cho cả tạo mới và cập nhật
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên danh mục'),
  type: z.enum(['expense', 'income']),
  icon: z.string().min(1),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// Giá trị mặc định cho form tạo mới
export const categoryDefaultValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  icon: 'Tag',
};
