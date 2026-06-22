import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Trích xuất public_id của Cloudinary từ URL hình ảnh.
 * Định dạng Cloudinary URL:
 * https://res.cloudinary.com/<cloud_name>/image/upload/(v<version>/)?<folder_path>/<filename>.<ext>
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  
  try {
    const regex = /\/image\/upload\/(?:v\d+\/)?([^.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (err) {
    console.error("Lỗi khi trích xuất public_id từ URL:", err);
    return null;
  }
}

/**
 * Gỡ bỏ tag tạm "love_temp" của các ảnh khi chúng được lưu chính thức vào Milestone.
 * @param imageUrls Mảng URL ảnh hoặc chuỗi JSON chứa mảng URL ảnh.
 */
export async function removeTempTag(imageUrls: string[] | string | null | undefined) {
  if (!imageUrls) return;

  let urls: string[] = [];
  if (Array.isArray(imageUrls)) {
    urls = imageUrls;
  } else if (typeof imageUrls === "string") {
    if (imageUrls.startsWith("[") && imageUrls.endsWith("]")) {
      try {
        urls = JSON.parse(imageUrls);
      } catch {
        urls = [imageUrls];
      }
    } else {
      urls = [imageUrls];
    }
  }

  const publicIds = urls
    .map(url => getPublicIdFromUrl(url))
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  try {
    // Gỡ bỏ tag "love_temp" cho các ảnh này trên Cloudinary
    await cloudinary.uploader.remove_tag("love_temp", publicIds);
    console.log(`Đã gỡ bỏ tag 'love_temp' cho các public_id:`, publicIds);
  } catch (err) {
    console.error("Lỗi khi gỡ tag 'love_temp' trên Cloudinary:", err);
  }
}

/**
 * Thêm tag tạm "love_temp" cho các ảnh khi Milestone bị xóa để cron job tự dọn dẹp.
 * @param imageUrls Mảng URL ảnh hoặc chuỗi JSON chứa mảng URL ảnh.
 */
export async function addTempTag(imageUrls: string[] | string | null | undefined) {
  if (!imageUrls) return;

  let urls: string[] = [];
  if (Array.isArray(imageUrls)) {
    urls = imageUrls;
  } else if (typeof imageUrls === "string") {
    if (imageUrls.startsWith("[") && imageUrls.endsWith("]")) {
      try {
        urls = JSON.parse(imageUrls);
      } catch {
        urls = [imageUrls];
      }
    } else {
      urls = [imageUrls];
    }
  }

  const publicIds = urls
    .map(url => getPublicIdFromUrl(url))
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  try {
    // Thêm tag "love_temp" cho các ảnh này trên Cloudinary
    await cloudinary.uploader.add_tag("love_temp", publicIds);
    console.log(`Đã gắn tag 'love_temp' cho các public_id:`, publicIds);
  } catch (err) {
    console.error("Lỗi khi gắn tag 'love_temp' trên Cloudinary:", err);
  }
}

