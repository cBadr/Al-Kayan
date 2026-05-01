"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";

interface NavItem { href: string; label: string; badge?: number | null }

export function MobileNav({
  nav,
  title,
  appName = "سلامة",
  user,
}: {
  nav: NavItem[];
  title: string;
  appName?: string;
  user?: { fullName: string | null; email: string | null; roleLabel: string };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initials = (user?.fullName ?? user?.email ?? "؟").trim().slice(0, 2);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors no-print"
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mounted && open && createPortal(
        <div
          className="lg:hidden fixed inset-0 no-print"
          style={{ position: "fixed", zIndex: 2147483646 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-mesh-emerald text-white flex flex-col animate-fade-up shadow-2xl"
            // Use grid so header / nav / footer share space cleanly and footer is always visible
            style={{ display: "grid", gridTemplateRows: "auto 1fr auto" }}
          >
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 min-w-0">
                <LogoMark className="w-9 h-9 shrink-0" />
                <div className="min-w-0">
                  <div className="font-black text-gradient-gold text-base leading-tight truncate">{appName}</div>
                  <div className="text-[10px] text-white/60 leading-tight truncate">{title}</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav (scrollable middle) */}
            <nav className="p-3 space-y-1 overflow-y-auto min-h-0">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-3 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold-400 text-obsidian-900 text-[11px] font-bold">{item.badge}</span>
                  ) : null}
                </Link>
              ))}
            </nav>

            {/* Footer with user info + logout — always visible */}
            {user && (
              <div className="p-3 border-t border-white/10 bg-black/30 backdrop-blur-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="avatar-ring shrink-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-gold-400 font-bold text-sm">
                      {initials}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white truncate">{user.fullName || user.email}</div>
                    <div className="text-[11px] text-gold-300/80 truncate">{user.roleLabel}</div>
                  </div>
                </div>
                <LogoutButton />
              </div>
            )}
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
