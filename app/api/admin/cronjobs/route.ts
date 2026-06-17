import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

const CRON_JOB_API_URL = "https://api.cron-job.org";

/**
 * Helper kiểm tra API Key và tạo headers
 */
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
 * GET /api/admin/cronjobs
 * Lấy danh sách toàn bộ cron job từ cron-job.org
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  try {
    const headers = getApiHeaders();
    const response = await fetch(`${CRON_JOB_API_URL}/jobs`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }, // Không cache để luôn lấy dữ liệu mới nhất
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Lỗi từ cron-job.org: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
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
 * POST /api/admin/cronjobs
 * Tạo một cron job mới (chuyển tiếp PUT tới cron-job.org)
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  try {
    const body = await req.json();
    const { job } = body;

    if (!job || !job.url) {
      return NextResponse.json(
        { error: "Thông tin job hoặc đường dẫn URL không hợp lệ" },
        { status: 400 }
      );
    }

    const headers = getApiHeaders();
    // cron-job.org API sử dụng PUT /jobs để tạo mới
    const response = await fetch(`${CRON_JOB_API_URL}/jobs`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ job }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return NextResponse.json(
        { error: `Không thể tạo cron job: ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
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
