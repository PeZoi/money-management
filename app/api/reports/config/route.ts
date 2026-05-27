import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

async function requireSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      supabase,
      user: null as null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { supabase, user, errorResponse: null as null };
}

/**
 * GET /api/reports/config?workspace_id=...&month=YYYY-MM
 * Lấy cấu hình bảng báo cáo. Nếu tháng hiện tại chưa có,
 * tự động trả về cấu hình của tháng gần nhất trước đó (auto-clone).
 */
export async function GET(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspace_id');
  const month = searchParams.get('month');

  if (!workspaceId || !isUuid(workspaceId)) {
    return NextResponse.json(
      { error: 'workspace_id phải là UUID hợp lệ.' },
      { status: 400 },
    );
  }
  if (!month || !isValidMonth(month)) {
    return NextResponse.json(
      { error: 'month phải có định dạng YYYY-MM.' },
      { status: 400 },
    );
  }

  // Thử lấy cấu hình cho đúng tháng được yêu cầu
  const { data, error } = await session.supabase
    .from('report_configs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('month', month)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Nếu đã có cấu hình cho tháng này, trả về ngay
  if (data) {
    return NextResponse.json({ data, cloned: false });
  }

  // Nếu chưa có, tìm tháng gần nhất trước đó để clone
  const { data: previousConfig, error: prevError } = await session.supabase
    .from('report_configs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .lt('month', month)
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prevError) {
    return NextResponse.json({ error: prevError.message }, { status: 500 });
  }

  // Trả về cấu hình clone từ tháng trước (nếu có) với flag cloned=true
  // để frontend biết đây là bản nháp chưa được lưu cho tháng hiện tại
  if (previousConfig) {
    return NextResponse.json({
      data: {
        ...previousConfig,
        id: null, // Chưa được lưu cho tháng hiện tại
        month,
      },
      cloned: true,
    });
  }

  // Không có gì hết → trả data null (người dùng tạo mới hoàn toàn)
  return NextResponse.json({ data: null, cloned: false });
}

/**
 * POST /api/reports/config
 * Upsert cấu hình bảng báo cáo cho workspace + tháng.
 * Body: { workspace_id, month, tables }
 */
export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : '';
  const month = typeof body.month === 'string' ? body.month.trim() : '';
  const tables = Array.isArray(body.tables) ? body.tables : null;

  if (!workspaceId || !isUuid(workspaceId)) {
    return NextResponse.json(
      { error: 'workspace_id phải là UUID hợp lệ.' },
      { status: 400 },
    );
  }
  if (!month || !isValidMonth(month)) {
    return NextResponse.json(
      { error: 'month phải có định dạng YYYY-MM.' },
      { status: 400 },
    );
  }
  if (tables === null) {
    return NextResponse.json(
      { error: 'tables phải là một mảng.' },
      { status: 400 },
    );
  }

  // Upsert: nếu đã tồn tại (workspace_id, month) thì update, ngược lại insert
  const { data, error } = await session.supabase
    .from('report_configs')
    .upsert(
      {
        workspace_id: workspaceId,
        month,
        tables,
      },
      {
        onConflict: 'workspace_id,month',
      },
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
