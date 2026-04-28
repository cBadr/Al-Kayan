/**
 * Minimal WhatsApp Cloud API client (text messages only).
 * Requires:
 *   WHATSAPP_TOKEN — system user token from Meta
 *   app_settings.whatsapp_phone_id — sender phone number ID
 */

import { getAppSettings } from "@/lib/app-settings";

export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return { ok: false, error: "WHATSAPP_TOKEN missing" };

  const s = await getAppSettings();
  if (!s.whatsapp_enabled || !s.whatsapp_phone_id) {
    return { ok: false, error: "WhatsApp not configured" };
  }

  // Normalize phone (must be E.164 without +)
  const phone = to.replace(/[^\d]/g, "");
  if (!phone) return { ok: false, error: "invalid phone" };

  const url = `https://graph.facebook.com/v22.0/${s.whatsapp_phone_id}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body },
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "fetch failed" };
  }
}
