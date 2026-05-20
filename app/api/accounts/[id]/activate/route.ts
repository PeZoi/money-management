import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/accounts/[id]/activate
 * Đặt tài khoản [id] làm active trong workspace, hủy active các tài khoản còn lại.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Lấy workspace_id của account này để reset các account cùng workspace
    const { data: account, error: fetchErr } = await supabase
      .from('accounts')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (fetchErr || !account) {
      return NextResponse.json({ success: false, message: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    // Bước 1: hủy active tất cả accounts cùng workspace
    const { error: resetErr } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('workspace_id', account.workspace_id);

    if (resetErr) throw resetErr;

    // Bước 2: set active cho account được chọn
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
