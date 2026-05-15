import type { MetadataRoute } from "next";
import { getIntegrationsSettings } from "@/lib/integrations";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const integrations = await getIntegrationsSettings();
  const base = (integrations.site_url ?? "").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/forgot-password", "/join"],
        // Block authenticated app areas + cron/api endpoints from indexing
        disallow: [
          "/me",
          "/super-admin",
          "/academy/",
          "/api/",
          "/scan",
          "/reset-password",
        ],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
