import { NextResponse } from "next/server";
import { subMonths, startOfDay } from "date-fns";

import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    // 1. Xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const { workspace_id, messages } = body;

    if (!isUuid(workspace_id)) {
      return NextResponse.json(
        { error: "workspace_id không hợp lệ." },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Thiếu lịch sử tin nhắn hoặc định dạng không hợp lệ." },
        { status: 400 }
      );
    }

    // 3. Kiểm tra xem người dùng có phải thành viên của workspace không
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập workspace này." },
        { status: 403 }
      );
    }

    // 4. Lấy dữ liệu các giao dịch trong 2 tháng qua làm context
    const startDate = startOfDay(subMonths(new Date(), 2)).toISOString();
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("workspace_id", workspace_id)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (txError) {
      return NextResponse.json(
        { error: `Lỗi truy vấn dữ liệu ngữ cảnh: ${txError.message}` },
        { status: 500 }
      );
    }

    // 5. Rút gọn dữ liệu giao dịch gửi lên AI
    const simplifiedTx = (transactions || []).map((t) => ({
      date: t.created_at ? t.created_at.split("T")[0] : "N/A",
      type: t.type === "income" ? "Thu nhập" : t.type === "expense" ? "Chi tiêu" : "Chuyển khoản",
      amount: Number(t.amount),
      category: t.category?.name || (t.type === "transfer" ? "Chuyển khoản" : "Khác"),
      note: t.note || "",
    }));

    // 6. Xây dựng Prompt hệ thống và ngữ cảnh giao dịch
    const systemPrompt = `Bạn là Trợ lý Phân tích Tài chính AI cá nhân tiếng Việt.
Bạn thân thiện, chuyên nghiệp, thông thái và luôn hướng tới việc giúp người dùng tối ưu hóa ngân sách của họ.

Bạn có quyền truy cập vào danh sách các giao dịch tài chính gần đây (trong 2 tháng qua) của người dùng để trả lời các câu hỏi.
Hãy tính toán và phân tích dữ liệu giao dịch này khi người dùng hỏi các câu hỏi như "Tháng này tôi tiêu bao nhiêu?", "Danh mục nào tốn tiền nhất?", "Mẹo tiết kiệm là gì?", v.v.

Danh sách giao dịch của người dùng (đơn vị: VND):
${JSON.stringify(simplifiedTx, null, 2)}

Quy tắc trả lời:
1. Luôn trả lời bằng tiếng Việt, xưng hô lịch sự (Ví dụ: "Tôi", "bạn" hoặc "Trợ lý AI", "bạn").
2. Chỉ dựa trên dữ liệu giao dịch được cung cấp ở trên để trả lời các câu hỏi liên quan đến số liệu. Nếu không có dữ liệu cho câu hỏi cụ thể, hãy nói rõ là dữ liệu chưa ghi nhận.
3. Sử dụng Markdown để định dạng câu trả lời rõ ràng (in đậm số tiền, tạo danh sách gạch đầu dòng, sử dụng bảng biểu nếu cần để so sánh thu chi).
4. Phân tích sâu sắc, đưa ra lời khuyên thiết thực nếu thấy chi tiêu của người dùng có dấu hiệu mất cân đối hoặc tăng cao.
5. Giữ câu trả lời ngắn gọn, trực diện, không dài dòng lan man.`;

    // 7. Gọi Groq API
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình API Key cho AI trên server." },
        { status: 500 }
      );
    }

    // Ghép system prompt vào trước lịch sử chat
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: fullMessages,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Groq Chat API Error]", response.status, errText);
      return NextResponse.json(
        { error: `AI Chat Error (${response.status})` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: "AI không trả về kết quả hợp lệ." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reply,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[AI Chat Route Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
