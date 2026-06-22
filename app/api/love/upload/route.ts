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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "avatar1" | "avatar2" | "background" | "milestone" | null;
    const connectionId = formData.get("connectionId") as string | null;
    const milestoneTitle = formData.get("milestoneTitle") as string | null;

    if (!file || !type || !connectionId) {
      return NextResponse.json(
        { error: "Thiếu thông tin file, loại upload hoặc ID kết nối" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Định dạng file không hợp lệ. Chỉ chấp nhận ảnh." },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dung lượng ảnh tối đa là 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const slugTitle = type === "milestone" && milestoneTitle ? slugify(milestoneTitle) : "chua-dat-ten";
    
    const folderPath = type === "milestone"
      ? `money-management/love-assets/${connectionId}/milestones/${slugTitle}`
      : `money-management/love-assets/${connectionId}`;

    const publicId = type === "milestone"
      ? `${slugTitle}_${Date.now()}`
      : `${type}_${Date.now()}`;

    // Upload lên Cloudinary
    const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: publicId,
          resource_type: "image",
          tags: type === "milestone" ? ["love_temp"] : undefined,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json(
        { error: "Tải ảnh lên Cloudinary thất bại." },
        { status: 500 }
      );
    }

    const publicUrl = uploadResult.secure_url;

    // 2. Cập nhật URL ảnh này vào bảng love_connections nếu không phải là milestone
    if (type !== "milestone") {
      const updatePayload: Record<string, string> = {};
      if (type === "background") {
        updatePayload.background_url = publicUrl;
      } else if (type === "avatar1") {
        updatePayload.user_1_avatar_url = publicUrl;
      } else if (type === "avatar2") {
        updatePayload.user_2_avatar_url = publicUrl;
      }

      const { error: dbError } = await supabase
        .from("love_connections")
        .update(updatePayload)
        .eq("id", connectionId);

      if (dbError) {
        return NextResponse.json(
          { error: `Đã upload ảnh nhưng không thể lưu vào database: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Tải ảnh lên thành công!",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Lỗi hệ thống: ${errorMsg}` },
      { status: 500 }
    );
  }
}
