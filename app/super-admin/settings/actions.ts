"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

export async function saveAppSettings(fd: FormData) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const update: Record<string, unknown> = {
    app_name: String(fd.get("app_name") ?? "سلامة"),
    tagline: (fd.get("tagline") as string) || null,
    contact_email: (fd.get("contact_email") as string) || null,
    contact_phone: (fd.get("contact_phone") as string) || null,
    contact_whatsapp: (fd.get("contact_whatsapp") as string) || null,
    support_url: (fd.get("support_url") as string) || null,
    default_currency: (fd.get("default_currency") as string) || "EGP",
    footer_text: (fd.get("footer_text") as string) || null,
    whatsapp_enabled: !!fd.get("whatsapp_enabled"),
    whatsapp_phone_id: (fd.get("whatsapp_phone_id") as string) || null,
    updated_at: new Date().toISOString(),
  };

  const newLogo = await uploadIfPresent("logos", fd, "logo", "app");
  if (newLogo) update.logo_url = newLogo;

  await admin.from("app_settings").update(update).eq("id", 1);
  revalidatePath("/", "layout");
}
