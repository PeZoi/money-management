import { NextResponse } from 'next/server';

/**
 * API Route phân tích giao dịch bằng Gemini AI (Structured JSON Output).
 * POST /api/transactions/parse
 * Body: { text: string, categories: { name: string, type: string }[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, categories } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Thiếu nội dung mô tả giao dịch' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chưa cấu hình GROQ_API_KEY trên server' },
        { status: 500 },
      );
    }

    // Tạo danh sách danh mục dạng text để AI tham khảo
    const categoryListStr =
      Array.isArray(categories) && categories.length > 0
        ? categories
            .map(
              (c: { name: string; type: string }) =>
                `- "${c.name}" (loại: ${c.type === 'income' ? 'thu nhập' : 'chi tiêu'})`,
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

    // Gọi Groq API (tương thích OpenAI) với model Llama 3.3 70B cực mạnh và miễn phí
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
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Groq API Error]', response.status, errText);
      
      // Phân tích chi tiết lỗi từ Groq
      let errorMessage = 'Lỗi khi gọi Groq API';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMessage = `Groq API: ${errJson.error.message}`;
        } else if (errJson.message) {
          errorMessage = `Groq API: ${errJson.message}`;
        }
      } catch {
        errorMessage = `Groq API Error (${response.status}): ${errText.substring(0, 100)}`;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 502 },
      );
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json(
        { success: false, error: 'Groq không trả về kết quả hợp lệ' },
        { status: 502 },
      );
    }

    const parsedResult = JSON.parse(resultText);

    return NextResponse.json({
      success: true,
      data: {
        amount: parsedResult.amount || null,
        type: parsedResult.type === 'income' ? 'income' : 'expense',
        category_suggestion: parsedResult.category_suggestion || null,
        clean_note: parsedResult.clean_note || text,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[Parse Transaction Error]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
