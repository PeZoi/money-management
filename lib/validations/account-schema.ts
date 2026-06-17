import { z } from 'zod';

/**
 * Schema Zod cho form tài khoản (Account)
 * Dùng chung cho cả tạo mới và cập nhật
 */
export const accountSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên tài khoản'),
    type: z.enum(['cash', 'bank', 'e_wallet', 'investment', 'savings', 'other']),
    // Lưu dạng string hiển thị (ví dụ: "100,000" hoặc "-50,000")
    // Sẽ transform sang number khi submit
    balance: z.string(),
    icon: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ'),
    is_system: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Parse và kiểm tra số dư tối đa
    const cleanBalance = data.balance.replace(/[^0-9-]/g, '');
    const numBalance = Number(cleanBalance);
    
    if (isNaN(numBalance)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Số dư không hợp lệ',
        path: ['balance'],
      });
    } else if (Math.abs(numBalance) > 9999999999999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Số dư quá lớn (tối đa ±9,999,999,999,999đ)',
        path: ['balance'],
      });
    }
  });

export type AccountFormValues = z.infer<typeof accountSchema>;

// Giá trị mặc định cho form tạo mới
export const accountDefaultValues: AccountFormValues = {
  name: '',
  type: 'cash',
  balance: '0',
  icon: '💰',
  color: '#6366f1',
  is_system: true,
};
