import { z } from "zod";

/**
 * Schema Zod cho form quản lý nợ (Debt)
 * Dùng chung cho cả tạo mới và cập nhật
 */
export const debtSchema = z.object({
  debtor_name: z.string().min(1, "Vui lòng nhập tên người nợ"),
  amount: z.string().min(1, "Vui lòng nhập số tiền nợ"),
  borrowed_at: z.string().min(1, "Vui lòng chọn ngày mượn tiền"),
  due_at: z.string().min(1, "Vui lòng chọn ngày trả tiền"),
  note: z.string().optional(),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

// Giá trị mặc định cho form tạo mới
export const debtDefaultValues: DebtFormValues = {
  debtor_name: "",
  amount: "",
  borrowed_at: new Date().toISOString().split("T")[0],
  due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Mặc định hẹn trả sau 7 ngày
  note: "",
};
