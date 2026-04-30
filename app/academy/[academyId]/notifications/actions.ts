"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { Resend } from "resend";
import { sendWhatsAppText } from "@/lib/whatsapp";

type Recipient = {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string;
};

async function resolveRecipients(
  sb: Awaited<ReturnType<typeof createClient>>,
  academyId: string,
  audience: string,
  fd: FormData,
): Promise<Recipient[]> {
  const baseSelect = "id, user_id, email, phone, full_name";

  // Specific players: audience = "players", with form field player_ids (comma-separated or repeated)
  if (audience === "players") {
    const ids = (fd.getAll("player_ids") as string[])
      .flatMap((v) => v.split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];
    const { data } = await sb.from("players")
      .select(baseSelect)
      .eq("academy_id", academyId)
      .in("id", ids);
    return (data ?? []) as Recipient[];
  }

  // Players with subscription expiring within N days (or overdue if 0)
  if (audience === "expiring") {
    const days = Math.max(0, Number(fd.get("expiring_days") ?? "7"));
    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    // Subscriptions due within window AND unpaid/partial.
    const { data: subs } = await sb.from("subscriptions")
      .select("player_id, due_date, status")
      .eq("academy_id", academyId)
      .in("status", ["unpaid", "partial", "overdue"])
      .gte("due_date", today)
      .lte("due_date", horizon);
    const playerIds = Array.from(new Set((subs ?? []).map((s: any) => s.player_id))).filter(Boolean);
    if (playerIds.length === 0) return [];
    const { data } = await sb.from("players")
      .select(baseSelect)
      .eq("academy_id", academyId)
      .eq("status", "active")
      .in("id", playerIds);
    return (data ?? []) as Recipient[];
  }

  // Players with overdue (past due) unpaid subscriptions
  if (audience === "overdue") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: subs } = await sb.from("subscriptions")
      .select("player_id")
      .eq("academy_id", academyId)
      .in("status", ["unpaid", "partial", "overdue"])
      .lt("due_date", today);
    const playerIds = Array.from(new Set((subs ?? []).map((s: any) => s.player_id))).filter(Boolean);
    if (playerIds.length === 0) return [];
    const { data } = await sb.from("players")
      .select(baseSelect)
      .eq("academy_id", academyId)
      .eq("status", "active")
      .in("id", playerIds);
    return (data ?? []) as Recipient[];
  }

  // Single category
  if (audience.startsWith("category:")) {
    const { data } = await sb.from("players")
      .select(baseSelect)
      .eq("academy_id", academyId)
      .eq("status", "active")
      .eq("category_id", audience.substring("category:".length));
    return (data ?? []) as Recipient[];
  }

  // Default: all active players in academy
  const { data } = await sb.from("players")
    .select(baseSelect)
    .eq("academy_id", academyId)
    .eq("status", "active");
  return (data ?? []) as Recipient[];
}

export async function sendNotification(academyId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  const audience = String(fd.get("audience") ?? "all");
  const channel = String(fd.get("channel") ?? "in_app") as "in_app" | "email" | "whatsapp";
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!title) return { error: "أدخل عنواناً" };

  const recipients = await resolveRecipients(sb, academyId, audience, fd);

  // Build a human-readable group label for logging
  let groupLabel = audience;
  if (audience === "expiring") groupLabel = `expiring:${fd.get("expiring_days") ?? 7}d`;
  if (audience === "players") {
    const ids = (fd.getAll("player_ids") as string[]).flatMap((v) => v.split(",")).filter(Boolean);
    groupLabel = `players:${ids.length}`;
  }

  const { data: summary } = await sb.from("notifications").insert({
    academy_id: academyId,
    recipient_user_id: null,
    recipient_group: groupLabel,
    channel,
    title,
    body: body || null,
    payload: { count: recipients.length, recipient_ids: recipients.map((r) => r.user_id).filter(Boolean) },
    status: "queued",
  }).select("id").single();

  const personal = recipients
    .filter((r) => r.user_id)
    .map((r) => ({
      academy_id: academyId,
      recipient_user_id: r.user_id,
      recipient_group: groupLabel,
      channel,
      title,
      body: body || null,
      status: "sent" as const,
      sent_at: new Date().toISOString(),
      payload: { broadcast_id: summary?.id },
    }));
  if (personal.length > 0) await sb.from("notifications").insert(personal);

  if (channel === "whatsapp") {
    for (const p of recipients) {
      if (!p.phone) continue;
      await sendWhatsAppText(p.phone, `*${title}*\n\n${body}`);
    }
  }

  if (channel === "email" && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
    for (const p of recipients) {
      if (!p.email) continue;
      try {
        await resend.emails.send({
          from, to: p.email, subject: title,
          html: `<div style="font-family:sans-serif;direction:rtl"><h2>${title}</h2><p>${body.replace(/\n/g, "<br>")}</p></div>`,
        });
      } catch { /* per-recipient errors swallowed */ }
    }
  }

  if (summary) {
    await sb.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", summary.id);
  }

  await sb.from("audit_log").insert({
    academy_id: academyId, actor_user_id: me.id, action: "notifications.send",
    metadata: { audience: groupLabel, channel, title, count: recipients.length },
  });

  revalidatePath(`/academy/${academyId}/notifications`);
}
