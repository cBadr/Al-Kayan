import { cache } from "react";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";

export interface AppSettings {
  id: number;
  app_name: string;
  tagline: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  support_url: string | null;
  footer_text: string | null;
  default_currency: string | null;
  whatsapp_enabled: boolean;
  whatsapp_phone_id: string | null;
  updated_at: string;
}

const DEFAULTS: AppSettings = {
  id: 1,
  app_name: "سلامة",
  tagline: "منصة أكاديميات كرة القدم",
  logo_url: null,
  contact_email: null,
  contact_phone: null,
  contact_whatsapp: null,
  support_url: null,
  footer_text: "جميع الحقوق محفوظة",
  default_currency: "EGP",
  whatsapp_enabled: false,
  whatsapp_phone_id: null,
  updated_at: new Date().toISOString(),
};

export const getAppSettings = cache(async (): Promise<AppSettings> => {
  // Graceful at build time / when env not configured
  if (!hasSupabaseEnv()) return DEFAULTS;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("app_settings").select("*").eq("id", 1).maybeSingle();
    return data ?? DEFAULTS;
  } catch {
    return DEFAULTS;
  }
});
