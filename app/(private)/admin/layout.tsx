import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Đảm bảo người dùng đã xác thực
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Truy vấn bảng user_roles để lấy role hệ thống của người dùng
  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("AdminLayout: Lỗi khi truy vấn vai trò admin:", roleError.message);
  }

  // Nếu không phải admin hoặc có lỗi xảy ra, chuyển hướng về dashboard
  if (roleError || roleRow?.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
