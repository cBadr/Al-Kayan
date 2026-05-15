import type { MetadataRoute } from "next";
import { getIntegrationsSettings } from "@/lib/integrations";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";

export const revalidate = 3600;  // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const integrations = await getIntegrationsSettings();
  const base = (integrations.site_url ?? "").replace(/\/$/, "") || "";

  // Static public routes — accessible without authentication.
  const staticPaths: string[] = ["/", "/login", "/forgot-password", "/join"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));

  // Dynamic per-academy join pages (each academy has a public /join/[slug] form).
  if (hasSupabaseEnv()) {
    try {
      const sb = createAdminClient();
      const { data: academies } = await sb.from("academies").select("slug, updated_at");
      for (const a of academies ?? []) {
        if (!a.slug) continue;
        entries.push({
          url: `${base}/join/${a.slug}`,
          lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    } catch {
      // best-effort: if DB unavailable just emit static entries
    }
  }

  return entries;
}
