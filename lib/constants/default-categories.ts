export interface DefaultCategory {
  name: string;
  icon: string;
  type: 'expense' | 'income';
  color: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: "Ăn uống", icon: "🍽️", type: "expense", color: "#ef4444" },
  { name: "Di chuyển", icon: "🚗", type: "expense", color: "#3b82f6" },
  { name: "Mua sắm", icon: "🛍️", type: "expense", color: "#10b981" },
  { name: "Nhà cửa", icon: "🏠", type: "expense", color: "#f59e0b" },
  { name: "Hóa đơn", icon: "⚡", type: "expense", color: "#6366f1" },
  { name: "Giải trí", icon: "✈️", type: "expense", color: "#ec4899" },
  { name: "Sức khỏe", icon: "💪", type: "expense", color: "#14b8a6" },
  { name: "Giáo dục", icon: "🎓", type: "expense", color: "#8b5cf6" },
  { name: "Gia đình", icon: "👶", type: "expense", color: "#f43f5e" },
  { name: "Quà tặng", icon: "🎁", type: "expense", color: "#fb7185" },
  { name: "Làm đẹp", icon: "💄", type: "expense", color: "#f472b6" },
  { name: "Thú cưng", icon: "🐱", type: "expense", color: "#fb923c" },
  { name: "Bảo hiểm", icon: "📄", type: "expense", color: "#94a3b8" },
  { name: "Sửa chữa", icon: "🛠️", type: "expense", color: "#78716c" },
  { name: "Dịch vụ", icon: "💻", type: "expense", color: "#06b6d4" },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: "Lương", icon: "💵", type: "income", color: "#10b981" },
  { name: "Đầu tư", icon: "📈", type: "income", color: "#3b82f6" },
  { name: "Tiền thưởng", icon: "🎉", type: "income", color: "#f59e0b" },
  { name: "Kinh doanh", icon: "💼", type: "income", color: "#ec4899" },
  { name: "Quà tặng", icon: "🎁", type: "income", color: "#a855f7" },
  { name: "Tiền lãi", icon: "🪙", type: "income", color: "#eab308" },
];
