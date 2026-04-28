import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return auth === expected || req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Find overdue subscriptions (period_end < today AND not paid)
  const { data: overdues } = await admin
    .from("subscriptions")
    .select("id, player_id, academy_id, amount_due, amount_paid, period_end, players(full_name, user_id)")
    .lt("period_end", todayStr)
    .neq("status", "paid")
    .limit(500);

  let queued = 0;
  for (const s of (overdues ?? []) as any[]) {
    const remaining = Number(s.amount_due) - Number(s.amount_paid);
    if (remaining <= 0) continue;

    // Skip if already notified within last 7 days for this subscription
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recent } = await admin
      .from("notifications")
      .select("id")
      .eq("payload->>subscription_id", s.id)
      .gte("created_at", since)
      .limit(1);
    if (recent && recent.length > 0) continue;

    await admin.from("notifications").insert({
      academy_id: s.academy_id,
      recipient_user_id: s.players?.user_id ?? null,
      channel: "in_app",
      title: "تذكير بسداد الاشتراك",
      body: `لديك مبلغ متأخر قدره ${remaining} للفترة المنتهية في ${s.period_end}.`,
      payload: { subscription_id: s.id },
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    queued++;
  }

  return NextResponse.json({ ok: true, queued, checked: overdues?.length ?? 0 });
}
