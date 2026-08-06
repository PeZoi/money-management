import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Chuyển chữ tiếng Việt có dấu thành dạng slug không dấu
 */
function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/[^\w-]+/g, "") // Xóa ký tự đặc biệt
    .replace(/--+/g, "-"); // Xóa dấu gạch ngang liền nhau
}

/**
 * POST /api/love/upload
 * Tải ảnh lên và lưu vào Supabase Storage, sau đó cập nhật URL vào love_connections.
 * Hỗ trợ các loại: 'avatar1' (User 1), 'avatar2' (User 2), 'background' (Hình nền).
 */
export async function POST(request: Request) {
  const supabase = createClient();

  // 1. Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const { type, connectionId, milestoneTitle } = await request.json();

    if (!type || !connectionId) {
      return NextResponse.json(
        { error: "Thiếu thông tin loại upload hoặc ID kết nối" },
        { status: 400 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const slugTitle = type === "milestone" && milestoneTitle ? slugify(milestoneTitle) : "chua-dat-ten";
    
    const folderPath = type === "milestone"
      ? `money-management/love-assets/${connectionId}/milestones/${slugTitle}`
      : `money-management/love-assets/${connectionId}`;

    const publicId = type === "milestone"
      ? `${slugTitle}_${Date.now()}`
      : `${type}_${Date.now()}`;

    // Các tham số cần ký để gửi lên Cloudinary
    const paramsToSign = {
      timestamp,
      folder: folderPath,
      public_id: publicId,
    };

    // Tạo signature sử dụng API Secret
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || ""
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      folder: folderPath,
      public_id: publicId,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Lỗi hệ thống sinh signature: ${errorMsg}` },
      { status: 500 }
    );
  }
}
