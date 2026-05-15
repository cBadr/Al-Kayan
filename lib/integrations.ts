import { cache } from "react";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";

export interface IntegrationsSettings {
  site_url: string | null;
  default_meta_description: string | null;
  default_og_image_url: string | null;

  ga4_enabled: boolean;
  ga4_measurement_id: string | null;

  gsc_enabled: boolean;
  gsc_verification_token: string | null;

  gcal_enabled: boolean;
  gcal_default_calendar_name: string | null;
}

const DEFAULTS: IntegrationsSettings = {
  site_url: null,
  default_meta_description: null,
  default_og_image_url: null,
  ga4_enabled: false,
  ga4_measurement_id: null,
  gsc_enabled: false,
  gsc_verification_token: null,
  gcal_enabled: false,
  gcal_default_calendar_name: null,
};

/** Cached fetch — runs once per request via React's `cache()`. Falls back to
 *  defaults during build / when env not configured / on any DB error. */
export const getIntegrationsSettings = cache(async (): Promise<IntegrationsSettings> => {
  if (!hasSupabaseEnv()) return DEFAULTS;
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("integrations_settings").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULTS, ...(data ?? {}) } as IntegrationsSettings;
  } catch {
    return DEFAULTS;
  }
});

/** Validate a GA4 measurement ID format (G-XXXXXXXXXX). */
export function isValidGa4Id(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^G-[A-Z0-9]{6,12}$/i.test(id.trim());
}

/** Strip a Google Search Console meta tag wrapper if the user pasted the full
 *  <meta ...> tag — keep only the content="..." token. */
export function extractGscToken(input: string): string {
  const trimmed = input.trim();
  // If the user pasted the full meta tag, extract content
  const match = trimmed.match(/content=["']([^"']+)["']/i);
  if (match) return match[1].trim();
  return trimmed;
}
