import Link from "next/link";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationsBell } from "@/components/notifications-bell";
import { PrintButton } from "@/components/print-button";
import { getAppSettings } from "@/lib/app-settings";

interface NavItem { href: string; label: string; icon?: ReactNode; badge?: number | null }

export async function AppShell({
  title,
  nav,
  user,
  children,
}: {
  title: string;
  nav: NavItem[];
  user: { fullName: string | null; email: string | null; roleLabel: string };
  children: ReactNode;
}) {
  const initials = (user.fullName ?? user.email ?? "؟").trim().slice(0, 2);
  const settings = await getAppSettings();
  const appName = settings.app_name;

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 shrink-0 bg-mesh-emerald text-white flex-col no-print relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-400/40 to-transparent" />
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <BrandLogo className="w-10 h-10 drop-shadow-md" rounded="rounded-xl" />
          <div>
            <Link href="/" className="block text-xl font-black tracking-wide text-gradient-gold">{appName}</Link>
            <p className="text-[11px] text-white/65 mt-0.5 truncate max-w-44">{title}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors relative"
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-6 bg-gold-400 rounded-l transition-all group-hover:w-1" />
              <span className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold-400 text-obsidian-900 text-[11px] font-bold animate-pulse-gold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 backdrop-blur-sm bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar-ring">
              <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-gold-400 font-bold text-sm">
                {initials}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white truncate">{user.fullName || user.email}</div>
              <div className="text-[11px] text-gold-300/80 mt-0.5">{user.roleLabel}</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-pitch">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-white/80 backdrop-blur-sm no-print">
          <MobileNav nav={nav} title={title} appName={appName} />
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo className="w-7 h-7" rounded="rounded-lg" />
            <span className="font-black text-emerald-900">{appName}</span>
          </Link>
          <NotificationsBell />
        </div>

        {/* Desktop top bar with bell only */}
        <div className="hidden md:flex justify-end px-8 py-2 border-b border-border bg-white/40 backdrop-blur-sm no-print">
          <NotificationsBell />
        </div>

        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title, description, actions, hidePrint,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Hide the default print button (use for forms/setup pages where printing is meaningless). */
  hidePrint?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-6 md:px-8 py-5 md:py-6 border-b border-border bg-white/70 backdrop-blur-sm no-print animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gradient-emerald">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {actions}
        {!hidePrint && <PrintButton />}
      </div>
    </div>
  );
}

/** Printed-only header that appears at the top of every printout — shows
 * academy name and date so the printed sheet is self-explanatory. */
export function PrintHeader({ academyName, subtitle }: { academyName: string; subtitle?: string }) {
  return (
    <div className="hidden print:block border-b-2 border-emerald-700 pb-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-emerald-900">{academyName}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="text-left text-[10px] text-muted-foreground">
          طُبع في {new Date().toLocaleString("ar-EG")}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 p-4 md:p-8 animate-fade-up">{children}</div>;
}
