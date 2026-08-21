/**
 * Logic phân tích giao dịch bằng AI chạy ở phía server hỗ trợ đa Provider (Groq, OpenRouter, Gemini, OpenAI, v.v.).
 */

import { callAICompletions } from "./ai-client-server";

export interface AISuggestion {
  amount: number;
  type: "expense" | "income";
  category_suggestion: string;
  clean_note: string;
}

/**
 * Gọi AI để phân tích cú pháp câu mô tả giao dịch (ví dụ: "ăn sáng 30k").
 * Hàm này chạy ở môi trường Server (Node.js/Next.js Route Handlers).
 */
export async function parseTransactionWithAI(
  text: string,
  categories: { name: string; type: string }[]
): Promise<AISuggestion> {
  // Tạo danh sách danh mục để AI tham khảo
  const categoryListStr =
    categories && categories.length > 0
      ? categories
        .map(
          (c) => `- "${c.name}" (loại: ${c.type === "income" ? "thu nhập" : "chi tiêu"})`
        )
        .join("\n")
      : "Không có danh mục sẵn.";

  const prompt = `Bạn là trợ lý phân tích giao dịch tài chính cá nhân tiếng Việt.
Hãy phân tích câu mô tả giao dịch sau và trả về kết quả dưới định dạng JSON duy nhất.

Câu mô tả: "${text.trim()}"

Danh sách danh mục hợp lệ trong hệ thống:
${categoryListStr}

Hãy trả về một đối tượng JSON có đúng cấu trúc sau:
{
  "amount": <số tiền VND quy đổi dạng số nguyên, ví dụ: 150000. Trả về 0 nếu không nhận diện được>,
  "type": <"expense" hoặc "income">,
  "category_suggestion": <Tên danh mục phù hợp nhất từ danh sách trên, hoặc "Khác" nếu không khớp>,
  "clean_note": <Ghi chú ngắn gọn mô tả giao dịch luôn luôn viết hoa ở đầu câu (ăn trưa -> Ăn trưa), loại bỏ phần số tiền và từ viết tắt thừa. Ví dụ: "ăn trưa 150k" -> "Ăn trưa">
}`;

  const resultText = await callAICompletions({
    messages: [{ role: "user", content: prompt }],
    responseFormat: "json_object",
    temperature: 0.1,
  });

  const parsedResult = JSON.parse(resultText);

  return {
    amount: Number(parsedResult.amount) || 0,
    type: parsedResult.type === "income" ? "income" : "expense",
    category_suggestion: parsedResult.category_suggestion || "Khác",
    clean_note: parsedResult.clean_note || text,
  };
}
