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
 * GET /api/admin/cronjobs/[id]/history
 * Lấy lịch sử thực thi của một cron job từ cron-job.org
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
    const response = await fetch(`${CRON_JOB_API_URL}/jobs/${id}/history`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Lỗi từ cron-job.org khi lấy lịch sử: ${response.status} - ${errorText}` },
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
