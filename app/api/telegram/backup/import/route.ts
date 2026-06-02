import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const userId = userData.user.id;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ success: false, message: "Dữ liệu JSON không hợp lệ." }, { status: 400 });
    }

    const accounts = Array.isArray(body.accounts) ? (body.accounts as Record<string, unknown>[]) : [];
    const categories = Array.isArray(body.categories) ? (body.categories as Record<string, unknown>[]) : [];
    const transactions = Array.isArray(body.transactions) ? (body.transactions as Record<string, unknown>[]) : [];

    // 1. Tìm workspace cá nhân của user trên DB
    const { data: personalWorkspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("created_by", userId)
      .eq("is_personal", true)
      .maybeSingle();

    if (wsError) {
      return NextResponse.json({ success: false, message: wsError.message }, { status: 500 });
    }

    if (!personalWorkspace) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy workspace cá nhân để import dữ liệu." },
        { status: 404 }
      );
    }

    const targetWorkspaceId = personalWorkspace.id;

    // 2. Thực hiện Import các Accounts (Tài khoản) - Thứ tự 1 để làm gốc cho Transactions
    if (accounts.length > 0) {
      const cleanAccounts = accounts.map((acc) => {
        const cleanAcc = { ...acc };
        cleanAcc.workspace_id = targetWorkspaceId;
        // Đảm bảo account thuộc sở hữu của user hiện tại
        cleanAcc.created_by = userId;
        return cleanAcc;
      });

      const { error: accErr } = await supabase
        .from("accounts")
        .upsert(cleanAccounts, { onConflict: "id" });
      if (accErr) {
        throw new Error(`Lỗi nhập dữ liệu tài khoản: ${accErr.message}`);
      }
    }

    // 3. Thực hiện Import các Categories (Danh mục) - Thứ tự 2 để làm gốc cho Transactions
    if (categories.length > 0) {
      const cleanCategories = categories.map((cat) => {
        const cleanCat = { ...cat };
        cleanCat.workspace_id = targetWorkspaceId;
        return cleanCat;
      });

      const { error: catErr } = await supabase
        .from("categories")
        .upsert(cleanCategories, { onConflict: "id" });
      if (catErr) {
        throw new Error(`Lỗi nhập dữ liệu danh mục: ${catErr.message}`);
      }
    }

    // 4. Thực hiện Import các Transactions (Giao dịch) - Thứ tự cuối để bảo toàn ràng buộc khoá ngoại
    if (transactions.length > 0) {
      const cleanTransactions = transactions.map((tx) => {
        const cleanTx = { ...tx };
        cleanTx.workspace_id = targetWorkspaceId;
        cleanTx.created_by = userId;
        return cleanTx;
      });

      const { error: txErr } = await supabase
        .from("transactions")
        .upsert(cleanTransactions, { onConflict: "id" });
      if (txErr) {
        throw new Error(`Lỗi nhập dữ liệu giao dịch: ${txErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Nhập dữ liệu sao lưu thành công!",
      details: {
        accounts: accounts.length,
        categories: categories.length,
        transactions: transactions.length,
      },
    });
  } catch (error: unknown) {
    console.error("Import backup data error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
