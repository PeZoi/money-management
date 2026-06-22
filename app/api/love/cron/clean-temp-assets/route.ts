import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/love/cron/clean-temp-assets
 * Endpoint dọn dẹp ảnh rác trên Cloudinary.
 * Tìm và xóa các ảnh được gắn tag "love_temp" đã tải lên cách đây hơn 24 giờ (1 ngày)
 * nhưng không được gỡ tag (do không bấm lưu cột mốc kỷ niệm).
 * 
 * Bảo mật: Yêu cầu query param `secret` khớp với `CRON_SECRET` trong môi trường nếu có cấu hình.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Kiểm tra bảo mật
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Chưa được cấp quyền truy cập" }, { status: 401 });
  }

  const isTest = searchParams.get("test") === "true";
  const expression = isTest ? "tags:love_temp" : "tags:love_temp AND uploaded_at < 1d";

  try {
    // 1. Tìm các ảnh có tag "love_temp" (nếu là chạy test, dọn sạch ngay cả khi vừa upload)
    const searchResult = await cloudinary.search
      .expression(expression)
      .max_results(100)
      .execute();

    const assets = searchResult.resources || [];

    if (assets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không tìm thấy ảnh rác nào cần dọn dẹp.",
        deleted_count: 0,
      });
    }

    const publicIds = assets.map((asset: { public_id: string }) => asset.public_id);

    // 2. Thực hiện xóa hàng loạt trên Cloudinary
    const deleteResult = await cloudinary.api.delete_resources(publicIds);

    console.log(`[Cron Job] Đã dọn dẹp thành công ${publicIds.length} ảnh rác trên Cloudinary:`, publicIds);

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp thành công ${publicIds.length} ảnh rác trên Cloudinary.`,
      deleted_assets: publicIds,
      details: deleteResult,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron Job Error] Lỗi dọn dẹp Cloudinary:", err);
    return NextResponse.json(
      { error: `Lỗi hệ thống: ${errorMsg}` },
      { status: 500 }
    );
  }
}
