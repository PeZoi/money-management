import { z } from 'zod';

/**
 * Schema Zod cho form giao dịch (Transaction)
 * amount lưu dạng string hiển thị (ví dụ: "100,000"), transform sang number khi submit
 */
export const transactionSchema = z
  .object({
    note: z.string(), // Để z.string() thay vì optional() để đồng nhất kiểu dữ liệu Input/Output
    // Lưu dạng string hiển thị có dấu phẩy, validate > 0 khi submit
    amount: z.string().min(1, 'Vui lòng nhập số tiền'),
    type: z.enum(['expense', 'income', 'transfer']),
    categoryId: z.string(), // Để z.string() thay vì optional() để đồng nhất kiểu dữ liệu Input/Output
    accountId: z.string().min(1, 'Vui lòng chọn tài khoản'),
    toAccountId: z.string(), // Để z.string() thay vì optional() để đồng nhất kiểu dữ liệu Input/Output
    date: z.date(),
  })
  .superRefine((data, ctx) => {
    // Validate số tiền phải > 0 và không vượt quá giới hạn numeric
    const numAmount = Number(data.amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Số tiền phải lớn hơn 0',
        path: ['amount'],
      });
    } else if (numAmount > 9999999999999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Số tiền quá lớn (tối đa 9,999,999,999,999đ)',
        path: ['amount'],
      });
    }

    // Validate chuyển tiền: phải có tài khoản đích và không trùng nguồn
    if (data.type === 'transfer') {
      if (!data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng chọn tài khoản nhận',
          path: ['toAccountId'],
        });
      }
      if (data.toAccountId && data.toAccountId === data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tài khoản nguồn và tài khoản đích không được trùng nhau',
          path: ['toAccountId'],
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// Giá trị mặc định cho form tạo mới
export const transactionDefaultValues: TransactionFormValues = {
  note: '',
  amount: '',
  type: 'expense',
  categoryId: '',
  accountId: '',
  toAccountId: '',
  date: new Date(),
};

/**
 * Định dạng số tiền sang dạng hiển thị có dấu phẩy (ví dụ: 100,000)
 */
export function formatAmountInput(val: string): string {
  const clean = val.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('en-US');
}

/**
 * Parse số tiền từ string hiển thị sang number
 */
export function parseAmount(val: string): number {
  return Number(val.replace(/[^0-9]/g, '')) || 0;
}
