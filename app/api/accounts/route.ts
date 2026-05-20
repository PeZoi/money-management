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
    const { workspace_id, name, type, balance, currency, icon, color } = body as Record<string, unknown>;

    if (!workspace_id || !name || !type) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        workspace_id,
        name,
        type: type || 'cash',
        balance: (balance as number) ?? 0,
        currency: (currency as string) || 'VND',
        icon: (icon as string) || '💰',
        color: (color as string) || '#6366f1',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
