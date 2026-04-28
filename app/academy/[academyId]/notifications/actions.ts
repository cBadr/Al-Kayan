"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { Resend } from "resend";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function sendNotification(academyId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  const audience = String(fd.get("audience") ?? "all");
  const channel = String(fd.get("channel") ?? "in_app") as "in_app" | "email" | "whatsapp";
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!title) return { error: "أدخل عنواناً" };

  // Resolve recipients
  const playersQ = sb.from("players").select("id, user_id, email, full_name").eq("academy_id", academyId).eq("status", "active");
  if (audience.startsWith("category:")) {
    playersQ.eq("category_id", audience.substring("category:".length));
  }
  const { data: players } = await playersQ;
  const recipients = (players ?? []) as any[];

  // Insert ONE summary row representing the broadcast (recipient_user_id = null)
  const { data: summary } = await sb.from("notifications").insert({
    academy_id: academyId,
    recipient_user_id: null,
    recipient_group: audience,
    channel,
    title,
    body: body || null,
    payload: { count: recipients.length, recipient_ids: recipients.map((r) => r.user_id).filter(Boolean) },
    status: "queued",
  }).select("id").single();

  // Insert ONE personal row per recipient that has a user account, so /me shows it
  const personal = recipients
    .filter((r) => r.user_id)
    .map((r) => ({
      academy_id: academyId,
      recipient_user_id: r.user_id,
      recipient_group: audience,
      channel,
      title,
      body: body || null,
      status: "sent" as const,
      sent_at: new Date().toISOString(),
      payload: { broadcast_id: summary?.id },
    }));
  if (personal.length > 0) await sb.from("notifications").insert(personal);

  // Send WhatsApp messages if needed
  if (channel === "whatsapp") {
    for (const p of recipients) {
      if (!p.phone) continue;
      await sendWhatsAppText(p.phone, `*${title}*\n\n${body}`);
    }
  }

  // Send emails if needed
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

  // Mark summary as sent
  if (summary) {
    await sb.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", summary.id);
  }

  await sb.from("audit_log").insert({
    academy_id: academyId, actor_user_id: me.id, action: "notifications.send",
    metadata: { audience, channel, title, count: recipients.length },
  });

  revalidatePath(`/academy/${academyId}/notifications`);
}
