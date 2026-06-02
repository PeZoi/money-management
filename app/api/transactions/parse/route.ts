import { NextResponse } from 'next/server';
import { parseTransactionWithAI } from '@/lib/utils/ai-parser-server';

/**
 * API Route phân tích giao dịch bằng Gemini/Groq AI (Structured JSON Output).
 * POST /api/transactions/parse
 * Body: { text: string, categories: { name: string; type: string }[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu JSON không hợp lệ' },
        { status: 400 },
      );
    }
    const { text, categories } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Thiếu nội dung mô tả giao dịch' },
        { status: 400 },
      );
    }

    const categoriesArray = Array.isArray(categories) ? categories : [];
    
    // Gọi hàm helper dùng chung ở phía server để phân tích
    const parsedData = await parseTransactionWithAI(text, categoriesArray);

    return NextResponse.json({
      success: true,
      data: {
        amount: parsedData.amount || null,
        type: parsedData.type,
        category_suggestion: parsedData.category_suggestion,
        clean_note: parsedData.clean_note,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[Parse Transaction Route Error]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

