"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/logo";

interface NavItem { href: string; label: string; badge?: number | null }

export function MobileNav({ nav, title, appName = "سلامة" }: { nav: NavItem[]; title: string; appName?: string }) {
  const [open, setOpen] = useState(false);

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

      {open && (
        <div className="lg:hidden fixed inset-0 z-[100] no-print">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-mesh-emerald text-white flex flex-col animate-fade-up shadow-2xl">
            <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <LogoMark className="w-9 h-9" />
                <div>
                  <div className="font-black text-gradient-gold text-lg">{appName}</div>
                  <div className="text-[10px] text-white/60 truncate">{title}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold-400 text-obsidian-900 text-[11px] font-bold">{item.badge}</span>
                  ) : null}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
