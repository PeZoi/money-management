import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

const CRON_JOB_API_URL = "https://api.cron-job.org";

function getApiHeaders() {
  const apiKey = process.env.CRON_JOB_API_KEY;
  if (!apiKey) {
    throw new Error("CRON_JOB_API_KEY_MISSING");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * GET /api/admin/cronjobs/[id]
 * Lấy chi tiết một cron job từ cron-job.org (gồm auth, extendedData/headers, v.v.)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;

  try {
    const headers = getApiHeaders();
    const response = await fetch(`${CRON_JOB_API_URL}/jobs/${id}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return NextResponse.json(
        { error: `Không thể lấy thông tin chi tiết cron job: ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    // cron-job.org trả về { job: DetailedJob } hoặc tương tự
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống";
    if (errorMessage === "CRON_JOB_API_KEY_MISSING") {
      return NextResponse.json(
        { error: "Vui lòng cấu hình CRON_JOB_API_KEY trong tệp .env.local" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cronjobs/[id]
 * Cập nhật một cron job (chuyển tiếp PATCH tới cron-job.org)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { job } = body;

    if (!job) {
      return NextResponse.json(
        { error: "Thông tin cập nhật không hợp lệ" },
        { status: 400 }
      );
    }

    const headers = getApiHeaders();
    const response = await fetch(`${CRON_JOB_API_URL}/jobs/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ job }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return NextResponse.json(
        { error: `Không thể cập nhật cron job: ${errorMessage}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống";
    if (errorMessage === "CRON_JOB_API_KEY_MISSING") {
      return NextResponse.json(
        { error: "Vui lòng cấu hình CRON_JOB_API_KEY trong tệp .env.local" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cronjobs/[id]
 * Xóa một cron job trên cron-job.org
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;

  try {
    const headers = getApiHeaders();
    const response = await fetch(`${CRON_JOB_API_URL}/jobs/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return NextResponse.json(
        { error: `Không thể xóa cron job: ${errorMessage}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống";
    if (errorMessage === "CRON_JOB_API_KEY_MISSING") {
      return NextResponse.json(
        { error: "Vui lòng cấu hình CRON_JOB_API_KEY trong tệp .env.local" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cronjobs/[id]
 * Kích hoạt thực thi cron job ngay lập tức trên cron-job.org
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;

  try {
    const headers = getApiHeaders();
    
    // 1. Lấy chi tiết cấu hình job từ cron-job.org
    const jobRes = await fetch(`${CRON_JOB_API_URL}/jobs/${id}`, {
      method: "GET",
      headers,
    });

    if (!jobRes.ok) {
      const errorData = await jobRes.json().catch(() => ({}));
      const errorMessage = errorData.message || jobRes.statusText;
      return NextResponse.json(
        { error: `Không thể tìm thấy thông tin cấu hình của cron job: ${errorMessage}` },
        { status: jobRes.status }
      );
    }

    const resJson = await jobRes.json();
    const job = resJson.jobDetails;

    if (!job || !job.url) {
      return NextResponse.json(
        { error: "Không tìm thấy cấu hình URL cho cron job này" },
        { status: 400 }
      );
    }

    // 2. Gửi HTTP request trực tiếp từ Backend tới URL của job để giả lập việc chạy thử
    const METHODS = ["GET", "POST", "OPTIONS", "HEAD", "PUT", "DELETE", "TRACE", "CONNECT", "PATCH"];
    const requestMethod = METHODS[job.requestMethod] || "GET";

    // Trích xuất headers tùy chỉnh nếu có cấu hình trên cron-job.org
    const runHeaders: Record<string, string> = {};
    if (job.extendedData?.headers) {
      Object.entries(job.extendedData.headers).forEach(([key, val]) => {
        runHeaders[key] = String(val);
      });
    }

    // Tự động chèn test=true khi kích hoạt chạy thử từ giao diện quản trị đối với API dọn dẹp
    let runUrl = job.url;
    if (runUrl.includes("/api/love/cron/clean-temp-assets")) {
      const separator = runUrl.includes("?") ? "&" : "?";
      if (!runUrl.includes("test=true") && !runUrl.includes("force=true")) {
        runUrl = `${runUrl}${separator}test=true`;
      }
    }

    console.log(`[Cron Job Test Run] Đang gọi trực tiếp URL: ${requestMethod} ${runUrl}`);
    
    const runRes = await fetch(runUrl, {
      method: requestMethod,
      headers: {
        ...runHeaders,
        "User-Agent": "MoneyPlus-CronJob-Test-Runner/1.0",
      },
      body: requestMethod !== "GET" && requestMethod !== "HEAD" && job.extendedData?.body 
        ? job.extendedData.body 
        : undefined,
    });

    const responseText = await runRes.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!runRes.ok) {
      return NextResponse.json(
        { 
          error: `Đường dẫn cron job trả về lỗi (Status ${runRes.status})`, 
          details: responseData 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Kích hoạt chạy thử thành công!",
      status: runRes.status,
      response: responseData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống";
    if (errorMessage === "CRON_JOB_API_KEY_MISSING") {
      return NextResponse.json(
        { error: "Vui lòng cấu hình CRON_JOB_API_KEY trong tệp .env.local" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

