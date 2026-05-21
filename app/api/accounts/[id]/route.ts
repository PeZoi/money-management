import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    const { name, type, balance, currency, icon, color } = body;

    let numBalance: number | undefined = undefined;
    if (balance !== undefined) {
      numBalance = Number(balance);
      if (isNaN(numBalance)) {
        return NextResponse.json({ success: false, message: 'Số dư không hợp lệ' }, { status: 400 });
      }
      if (Math.abs(numBalance) > 9999999999999) {
        return NextResponse.json({ success: false, message: 'Số dư quá lớn (tối đa ±9,999,999,999,999đ)' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({ 
        name, 
        type, 
        ...(balance !== undefined && { balance: numBalance }), 
        currency, 
        icon, 
        color 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes("numeric field overflow")) {
      message = "Số dư tài khoản vượt quá giới hạn tối đa của hệ thống.";
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
