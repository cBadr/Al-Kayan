"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/app/actions/notifications";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    let ignore = false;

    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb
        .from("notifications")
        .select("id, title, body, created_at, read_at")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!ignore && data) setItems(data as any);
    }
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read_at).length;

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      const ids = items.filter((n) => !n.read_at).map((n) => n.id);
      await markNotificationRead(ids);
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full bg-white border border-border hover:border-emerald-700/40 flex items-center justify-center transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-4 h-4 text-emerald-900" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-gold-400 text-obsidian-900 text-[10px] font-bold animate-pulse-gold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 max-w-[90vw] glass rounded-xl shadow-xl z-50 animate-fade-up overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-emerald-50/50">
            <h3 className="font-bold text-sm text-emerald-950">الإشعارات</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">لا توجد إشعارات</p>
            )}
            {items.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-emerald-50/30 transition-colors">
                <div className="flex justify-between gap-2 items-start">
                  <span className="font-semibold text-sm text-emerald-950">{n.title}</span>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 mt-1.5" />}
                </div>
                {n.body && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1.5" dir="ltr">
                  {new Date(n.created_at).toLocaleString("ar-EG")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
