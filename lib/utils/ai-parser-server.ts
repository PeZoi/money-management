/**
 * Logic phân tích giao dịch bằng AI chạy ở phía server (Groq Cloud API).
 */

export interface AISuggestion {
  amount: number;
  type: 'expense' | 'income';
  category_suggestion: string;
  clean_note: string;
}

/**
 * Gọi Groq API để phân tích cú pháp câu mô tả giao dịch bằng AI.
 * Hàm này chỉ chạy được ở môi trường Server (Node.js/Next.js Route Handlers) vì cần sử dụng API Key bảo mật.
 * 
 * @param text Câu mô tả giao dịch người dùng nhập (ví dụ: "ăn sáng 30k")
 * @param categories Danh sách các danh mục trong workspace của người dùng để AI đối chiếu
 */
export async function parseTransactionWithAI(
  text: string,
  categories: { name: string; type: string }[]
): Promise<AISuggestion> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key cho AI (GROQ_API_KEY, OPENROUTER_API_KEY, hoặc GEMINI_API_KEY) trên server.');
  }

  // Tạo danh sách danh mục để AI tham khảo
  const categoryListStr =
    categories && categories.length > 0
      ? categories
          .map(
            (c) => `- "${c.name}" (loại: ${c.type === 'income' ? 'thu nhập' : 'chi tiêu'})`
          )
          .join('\n')
      : 'Không có danh mục sẵn.';

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
  "clean_note": <Ghi chú ngắn gọn mô tả giao dịch, loại bỏ phần số tiền và từ viết tắt thừa. Ví dụ: "Ăn trưa 150k" -> "Ăn trưa">
}`;

  // Gọi Groq API với model Llama 3.3 70b cho kết quả nhanh và chính xác
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Groq API Error in Helper]', response.status, errText);
    
    let errorMessage = 'Lỗi khi gọi API của AI';
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errorMessage = `AI API Error: ${errJson.error.message}`;
      }
    } catch {
      errorMessage = `AI API Error (${response.status}): ${errText.substring(0, 100)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;

  if (!resultText) {
    throw new Error('AI không trả về kết quả hợp lệ');
  }

  const parsedResult = JSON.parse(resultText);

  return {
    amount: Number(parsedResult.amount) || 0,
    type: parsedResult.type === 'income' ? 'income' : 'expense',
    category_suggestion: parsedResult.category_suggestion || 'Khác',
    clean_note: parsedResult.clean_note || text,
  };
}
