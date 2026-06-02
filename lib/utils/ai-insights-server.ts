export interface AIInputTransaction {
  created_at: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number | string;
  category: { name: string } | null;
  note: string | null;
}

export interface AIAlert {
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  impact: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  potential_saving: number; // số tiền tiết kiệm được ước tính (VND)
}

export interface AICategoryAnalysis {
  category: string;
  percentage: number;
  amount: number;
  status: 'high' | 'normal' | 'low';
}

export interface AIInsightsResponse {
  summary: string;
  metrics: {
    total_expense: number;
    total_income: number;
    saving_rate: number; // phần trăm tích lũy (0-100)
    most_spent_category: string;
    most_spent_amount: number;
  };
  alerts: AIAlert[];
  recommendations: AIRecommendation[];
  categories_analysis: AICategoryAnalysis[];
}

/**
 * Gọi Groq API để phân tích dữ liệu chi tiêu trong 1-3 tháng qua.
 * Trả về kết quả phân tích có cấu trúc chi tiết để hiển thị trên UI.
 */
export async function generateInsightsWithAI(
  transactions: AIInputTransaction[],
  categories: { name: string; type: string }[],
  monthsCount: number
): Promise<AIInsightsResponse> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key cho AI (GROQ_API_KEY, OPENROUTER_API_KEY, hoặc GEMINI_API_KEY) trên server.');
  }

  // 1. Tối ưu hóa payload transactions gửi lên AI để tiết kiệm token
  // Chỉ lấy các thông tin thực sự cần thiết cho việc phân tích tài chính
  const simplifiedTransactions = transactions.map((t) => ({
    date: t.created_at ? t.created_at.split('T')[0] : 'N/A',
    type: t.type, // 'expense' | 'income' | 'transfer'
    amount: Number(t.amount),
    category: t.category?.name || (t.type === 'transfer' ? 'Chuyển khoản' : 'Khác'),
    note: t.note || '',
  }));

  const categoryListStr = categories.map((c) => c.name).join(', ');

  const prompt = `Bạn là chuyên gia phân tích tài chính cá nhân AI tiếng Việt xuất sắc.
Hãy phân tích dữ liệu giao dịch tài chính cá nhân của người dùng trong ${monthsCount} tháng qua và trả về kết quả dưới dạng JSON duy nhất.

Danh sách các danh mục trong hệ thống: [${categoryListStr}]

Dữ liệu giao dịch (đơn vị: VND):
${JSON.stringify(simplifiedTransactions, null, 2)}

Yêu cầu phân tích:
1. Tính toán các chỉ số cơ bản (Tổng chi tiêu, tổng thu nhập, tỷ lệ tích lũy/tiết kiệm, danh mục chi tiêu nhiều nhất).
2. Phát hiện các bất thường hoặc xu hướng đáng chú ý (Ví dụ: chi tiêu cho một danh mục tăng đột biến, chi tiêu quá mức so với thu nhập, chi tiêu quá nhiều cho các dịch vụ không thiết yếu như cafe, ăn ngoài, giải trí...).
3. Đưa ra ít nhất 1-3 cảnh báo sớm (alerts) nếu có vấn đề về thói quen tiêu dùng.
4. Đưa ra ít nhất 2-4 lời khuyên tài chính thực tế, có thể hành động được (recommendations) giúp người dùng tiết kiệm tiền, kèm theo ước tính số tiền có thể tiết kiệm được (potential_saving) mỗi tháng bằng VND nếu làm theo.
5. Phân tích chi tiết từng danh mục chi tiêu, xếp hạng trạng thái chi tiêu ("high" nếu chiếm tỷ trọng lớn hoặc tăng nhanh, "normal" nếu hợp lý, "low" nếu tiêu ít hoặc đã cắt giảm tốt).

Hãy trả về một đối tượng JSON có đúng cấu trúc sau và KHÔNG chứa bất kỳ đoạn text giải thích nào ngoài JSON:
{
  "summary": "Đoạn văn ngắn (2-3 câu) nhận xét tổng quan và đánh giá khách quan về sức khỏe tài chính của người dùng trong thời gian qua.",
  "metrics": {
    "total_expense": <tổng tiền chi tiêu dạng số nguyên>,
    "total_income": <tổng tiền thu nhập dạng số nguyên>,
    "saving_rate": <tỷ lệ tiết kiệm = ((thu nhập - chi tiêu) / thu nhập) * 100, làm tròn số nguyên. Trả về 0 nếu chi tiêu vượt thu nhập>,
    "most_spent_category": "<tên danh mục chi tiêu nhiều nhất>",
    "most_spent_amount": <số tiền chi cho danh mục đó>
  },
  "alerts": [
    {
      "type": "warning" hoặc "critical" hoặc "info",
      "category": "<tên danh mục liên quan>",
      "message": "<thông điệp cảnh báo ngắn gọn, ví dụ: Chi tiêu cho ăn uống tăng 35% so với tháng trước>",
      "impact": "<ảnh hưởng của việc này tới tài chính, ví dụ: Làm giảm 1.2 triệu tiền tiết kiệm dự phòng của bạn>"
    }
  ],
  "recommendations": [
    {
      "title": "<tiêu đề lời khuyên ngắn gọn, ví dụ: Hạn chế mua cafe ngoài>",
      "description": "<mô tả chi tiết giải pháp thực hiện, ví dụ: Bạn đã uống cafe 22 lần tháng này. Hãy thử tự pha cafe tại nhà hoặc giảm xuống còn 2 lần/tuần.>",
      "potential_saving": <số tiền ước tính tiết kiệm được dạng số nguyên, ví dụ: 600000>
    }
  ],
  "categories_analysis": [
    {
      "category": "<tên danh mục>",
      "percentage": <tỷ lệ phần trăm chi tiêu của danh mục này trên tổng chi tiêu (0-100)>,
      "amount": <tổng số tiền chi cho danh mục này>,
      "status": "high" hoặc "normal" hoặc "low"
    }
  ]
}`;

  // Gọi Groq API
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
        temperature: 0.2,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Groq API Insights Error]', response.status, errText);
    throw new Error(`AI Insights API Error (${response.status}): ${errText.substring(0, 100)}`);
  }

  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;

  if (!resultText) {
    throw new Error('AI không trả về kết quả phân tích hợp lệ');
  }

  return JSON.parse(resultText) as AIInsightsResponse;
}
