import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const type = body.type === "income" || body.type === "expense" ? body.type : null;
  const category = typeof body.category === "string" ? body.category : null;
  const occurred_at =
    typeof body.occurred_at === "string" ? body.occurred_at : new Date().toISOString();
  const note = typeof body.note === "string" ? body.note : null;
  const account_id = typeof body.account_id === "string" ? body.account_id : null;

  if (!Number.isFinite(amount) || !type || !category || !account_id) {
    return NextResponse.json(
      { error: "Missing/invalid fields: amount, type, category, account_id" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert([{ amount, type, category, occurred_at, note, account_id }])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

