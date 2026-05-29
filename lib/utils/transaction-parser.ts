/**
 * Logic phân tích giao dịch thông minh hoàn toàn bằng Gemini AI.
 */

// =====================================================
// TYPES
// =====================================================

export interface ParsedTransaction {
  /** Số tiền thô đã quy đổi (VND), null nếu không nhận diện được */
  amount: number | null;
  /** Loại giao dịch: thu nhập hoặc chi tiêu */
  type: 'expense' | 'income';
  /** Tên danh mục gợi ý (khớp với tên trong DB), null nếu không tìm thấy */
  categorySuggestion: string | null;
  /** Ghi chú đã loại bỏ phần số tiền */
  cleanNote: string;
  /** Nguồn phân tích: offline (regex) hoặc online (AI) */
  source: 'online';
}

interface CategoryInfo {
  id: string;
  name: string;
  type: string;
}

// =====================================================
// ONLINE PARSER (GEMINI AI)
// =====================================================

/**
 * Gọi API phân tích giao dịch bằng Gemini AI.
 */
export async function parseTransactionOnline(
  text: string,
  categories: CategoryInfo[],
): Promise<ParsedTransaction> {
  const res = await fetch('/api/transactions/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      categories: categories.map((c) => ({ name: c.name, type: c.type })),
    }),
  });

  if (!res.ok) {
    throw new Error('Không thể phân tích bằng AI. Vui lòng thử lại sau.');
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Phân tích AI thất bại');
  }

  const data = json.data;
  return {
    amount: data.amount || null,
    type: data.type === 'income' ? 'income' : 'expense',
    categorySuggestion: data.category_suggestion || null,
    cleanNote: data.clean_note || text,
    source: 'online',
  };
}
