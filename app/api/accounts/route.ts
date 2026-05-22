import { createClient } from '@/lib/supabase/server';
// Route handler cho tài khoản (accounts)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const workspace_id = req.nextUrl.searchParams.get('workspace_id');
    if (!workspace_id) {
      return NextResponse.json({ success: false, message: 'workspace_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { workspace_id, name, type, balance, currency, icon, color, is_active } = body as Record<string, unknown>;

    if (!workspace_id || !name || !type) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const numBalance = balance !== undefined ? Number(balance) : 0;
    if (isNaN(numBalance)) {
      return NextResponse.json({ success: false, message: 'Số dư không hợp lệ' }, { status: 400 });
    }
    if (Math.abs(numBalance) > 9999999999999) {
      return NextResponse.json({ success: false, message: 'Số dư quá lớn (tối đa ±9,999,999,999,999đ)' }, { status: 400 });
    }

    // Nếu yêu cầu kích hoạt tài khoản này, hủy kích hoạt các tài khoản cùng workspace trước
    if (is_active === true) {
      const { error: deactivateError } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('workspace_id', workspace_id);
      
      if (deactivateError) throw deactivateError;
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        workspace_id,
        name,
        type: type || 'cash',
        balance: numBalance,
        currency: (currency as string) || 'VND',
        icon: (icon as string) || '💰',
        color: (color as string) || '#6366f1',
        is_active: is_active === true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes("numeric field overflow")) {
      message = "Số dư tài khoản vượt quá giới hạn tối đa của hệ thống.";
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
