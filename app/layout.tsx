import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getIntegrationsSettings } from "@/lib/integrations";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// Static metadata — touching Supabase here breaks prerendering of /_not-found.
// Per-page titles can be set via their own generateMetadata.
export const metadata: Metadata = {
  title: "سلامة — منصة أكاديميات كرة القدم",
  description: "منصة احترافية متكاملة لإدارة أكاديميات كرة القدم",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Read integrations settings once per request (cached). Falls back to defaults
  // when DB unavailable so layout still renders during build.
  const integrations = await getIntegrationsSettings();
  const ga4 = integrations.ga4_enabled ? integrations.ga4_measurement_id : null;
  const gscToken = integrations.gsc_enabled ? integrations.gsc_verification_token : null;

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}>
      <head>
        {/* Google Search Console verification (only when enabled + token set). */}
        {gscToken && <meta name="google-site-verification" content={gscToken} />}
      </head>
      <body className="min-h-full flex flex-col bg-pitch font-sans text-foreground">
        <Providers>{children}</Providers>
        {/* GA4 — script tags appear at end of body (afterInteractive). Renders nothing if ID is null. */}
        <GoogleAnalytics measurementId={ga4} />
      </body>
    </html>
  );
}
