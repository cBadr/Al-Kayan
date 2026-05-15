"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { isValidGa4Id, extractGscToken } from "@/lib/integrations";

const googleSchema = z.object({
  site_url: z.string().url("رابط الموقع غير صالح").or(z.literal("")).optional(),
  default_meta_description: z.string().max(300).optional(),

  ga4_enabled: z.boolean().optional(),
  ga4_measurement_id: z.string().optional(),

  gsc_enabled: z.boolean().optional(),
  gsc_verification_token: z.string().optional(),
});

export async function saveGoogleIntegrations(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();

  const ga4Id = String(fd.get("ga4_measurement_id") ?? "").trim();
  const ga4Enabled = fd.get("ga4_enabled") === "on";

  // Validate GA4 ID only if enabled.
  if (ga4Enabled && !isValidGa4Id(ga4Id)) {
    return { error: "معرّف Google Analytics غير صالح. التنسيق المتوقع: G-XXXXXXXXXX" };
  }

  const gscRawToken = String(fd.get("gsc_verification_token") ?? "").trim();
  const gscEnabled = fd.get("gsc_enabled") === "on";
  const gscToken = gscRawToken ? extractGscToken(gscRawToken) : "";

  if (gscEnabled && !gscToken) {
    return { error: "أدخل رمز التحقق من Google Search Console (Meta Tag content)" };
  }

  const update = {
    site_url: textOrNull(fd.get("site_url")),
    default_meta_description: textOrNull(fd.get("default_meta_description")),
    ga4_enabled: ga4Enabled,
    ga4_measurement_id: ga4Id || null,
    gsc_enabled: gscEnabled,
    gsc_verification_token: gscToken || null,
  };

  // Soft validate (Zod) — main validation already above; this catches URL format etc.
  const parsed = googleSchema.safeParse({
    site_url: update.site_url ?? "",
    default_meta_description: update.default_meta_description ?? "",
    ga4_enabled: update.ga4_enabled,
    ga4_measurement_id: update.ga4_measurement_id ?? "",
    gsc_enabled: update.gsc_enabled,
    gsc_verification_token: update.gsc_verification_token ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const sb = await createClient();
  const { error } = await sb.from("integrations_settings").update(update).eq("id", 1);
  if (error) return { error: error.message };

  // Revalidate the entire app — GA4 + GSC tags are in the root layout.
  revalidatePath("/", "layout");
  revalidatePath("/super-admin/integrations");
  return { ok: true };
}

function textOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}
