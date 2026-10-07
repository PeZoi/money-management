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
 
export interface AISmsExpenseSuggestion {
  amount: number;
  type: "expense";
  category_suggestion: string;
  clean_note: string;
  transaction_date: string | null;
}

/**
 * Phân tích tin nhắn SMS ngân hàng kết hợp ghi chú người dùng từ Apple Shortcuts.
 * Đảm bảo: Loại luôn là "expense", AI phân loại danh mục, bóc tách số tiền và ngày giờ giao dịch.
 */
export async function parseSmsExpenseWithAI(params: {
  sms: string;
  note?: string;
  categories: { id: string; name: string }[];
}): Promise<AISmsExpenseSuggestion> {
  const { sms, note, categories } = params;

  // Tạo danh sách danh mục chi tiêu hệ thống
  const categoryListStr =
    categories && categories.length > 0
      ? categories.map((c) => `- "${c.name}"`).join("\n")
      : "Không có danh mục sẵn.";

  const prompt = `Bạn là trợ lý tài chính thông minh phân tích dữ liệu biến động số dư ngân hàng (bao gồm tin nhắn SMS, thông báo OTT và Email biên lai chuyển tiền Payment Receipt) kết hợp ghi chú người dùng tại Việt Nam.
Nhiệm vụ của bạn là bóc tách thông tin giao dịch chi tiêu để ghi sổ tự động và trả về JSON duy nhất.

Dữ liệu giao dịch ngân hàng (SMS / Thông báo / Nội dung Email):
"""${sms.trim()}"""

Ghi chú của người dùng (nếu có):
"""${(note || "").trim()}"""

Danh sách danh mục chi tiêu hợp lệ trong hệ thống:
${categoryListStr}

Yêu cầu phân tích:
1. "amount": Bóc tách số tiền chi tiêu dạng số nguyên VND dương:
   - Nếu là SMS/Thông báo: tìm số tiền biến động giảm (ví dụ: "-45,000VND" hoặc "45.000d" -> 45000).
   - Nếu là Email biên lai chuyển tiền (Payment Receipt): tìm trường "Số tiền" / "Amount" (ví dụ: "Số tiền 2,000 VND" -> 2000). Bỏ qua số tiền phí nếu có (ví dụ phí 0 VND).
   - Bỏ dấu trừ và ký hiệu tiền tệ. Nếu không tìm thấy số tiền hợp lệ, trả về 0.
2. "type": Luôn luôn là "expense".
3. "category_suggestion": Dựa vào ghi chú người dùng (ưu tiên cao nhất) hoặc nội dung chuyển tiền, đơn vị thụ hưởng trong SMS/Email để chọn danh mục khớp nhất từ danh sách trên. Nếu không có danh mục phù hợp, trả về "Khác".
4. "clean_note": 
   - Nếu người dùng có nhập ghi chú, sử dụng ghi chú đó (chuẩn hoá viết hoa chữ cái đầu).
   - Nếu người dùng không nhập ghi chú: trích xuất ngắn gọn nội dung chuyển tiền / đơn vị thụ hưởng từ SMS hoặc Email (ví dụ: "Chuyển tiền cho PHAM NGOC VIEN DONG" hoặc nội dung chi tiêu cụ thể, bỏ bớt các mã số lệnh, số thẻ rác).
5. "transaction_date": Trích xuất ngày giờ giao dịch từ SMS/Email và quy đổi sang định dạng ISO "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam. Ví dụ "15:47 Thứ Ba 06/10/2026" -> "2026-10-06T15:47:00". Nếu không có ngày giờ rõ ràng, trả về null.

Hãy trả về một đối tượng JSON duy nhất có định dạng:
{
  "amount": <number>,
  "type": "expense",
  "category_suggestion": <string>,
  "clean_note": <string>,
  "transaction_date": <string hoặc null>
}`;

  try {
    const resultText = await callAICompletions({
      messages: [{ role: "user", content: prompt }],
      responseFormat: "json_object",
      temperature: 0.1,
    });

    const parsedResult = JSON.parse(resultText);

    return {
      amount: Math.abs(Number(parsedResult.amount)) || 0,
      type: "expense",
      category_suggestion: parsedResult.category_suggestion || "Khác",
      clean_note: parsedResult.clean_note || (note?.trim() || "Chi tiêu qua ngân hàng"),
      transaction_date: parsedResult.transaction_date || null,
    };
  } catch (error) {
    console.error("Lỗi khi AI phân tích SMS:", error);
    // Fallback cơ bản khi AI gặp sự cố
    const amountMatch = sms.match(/-?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:VND|vnd|đ|d)?/);
    let fallbackAmount = 0;
    if (amountMatch) {
      fallbackAmount = parseInt(amountMatch[1].replace(/[.,]/g, ""), 10) || 0;
    }

    return {
      amount: fallbackAmount,
      type: "expense",
      category_suggestion: "Khác",
      clean_note: note?.trim() || "Chi tiêu qua ngân hàng",
      transaction_date: null,
    };
  }
}
