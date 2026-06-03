import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/love/my-connection
 * Lấy kết nối tình yêu của user hiện tại.
 */
export async function GET() {
  const supabase = createClient();

  // Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Gọi RPC get_my_love_connection
  const { data, error } = await supabase.rpc("get_my_love_connection");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC trả về TABLE, ta chỉ cần dòng đầu tiên (vì một user chỉ có tối đa 1 connection)
  const connection = data && data.length > 0 ? data[0] : null;

  if (connection) {
    // Truy vấn thêm user_id_1 để xác định vai trò của user hiện tại ở client
    const { data: connDetails } = await supabase
      .from("love_connections")
      .select("user_id_1")
      .eq("id", connection.connection_id)
      .single();

    if (connDetails) {
      connection.is_user_1 = connDetails.user_id_1 === userData.user.id;
    }
  }

  return NextResponse.json({ data: connection });
}
