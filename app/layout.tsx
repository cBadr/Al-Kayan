import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-pitch font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
