import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getAppSettings } from "@/lib/app-settings";

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

export async function generateMetadata(): Promise<Metadata> {
  const s = await getAppSettings();
  return {
    title: `${s.app_name} — ${s.tagline ?? ""}`.trim().replace(/—\s*$/, ""),
    description: s.tagline ?? "منصة احترافية متكاملة لإدارة أكاديميات كرة القدم",
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-pitch font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
