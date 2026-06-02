export async function GET(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response("Missing TELEGRAM_BOT_TOKEN", { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new Response("Missing path parameter", { status: 400 });
  }

  // Đảm bảo path hợp lệ, không chứa các ký tự lùi thư mục hoặc chèn ép để bảo mật
  if (path.includes("..") || path.startsWith("/") || !path.startsWith("photos/")) {
    return new Response("Invalid path", { status: 400 });
  }

  try {
    const telegramUrl = `https://api.telegram.org/file/bot${token}/${path}`;
    const res = await fetch(telegramUrl);

    if (!res.ok) {
      return new Response("Failed to fetch image from Telegram", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        // Cache ảnh trong 24 giờ để tăng hiệu năng và tránh bị rate limit từ Telegram
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Error in Telegram avatar proxy:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
