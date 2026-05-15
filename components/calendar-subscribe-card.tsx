"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getOrCreateCalendarToken, regenerateCalendarToken } from "@/app/me/calendar-actions";

interface Props {
  initialToken: string | null;
  enabled: boolean;             // calendar feature globally enabled?
  /** Calendar display name from settings — shown to the user. */
  calendarName?: string | null;
}

export function CalendarSubscribeCard({ initialToken, enabled, calendarName }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [pending, startTransition] = useTransition();
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        ⏸ مزامنة التقويم غير مفعَّلة من قبل المسؤول.
      </div>
    );
  }

  const url = token && origin ? `${origin}/api/calendar/${token}` : "";
  const googleAddUrl = url ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(url)}` : "";

  function ensureToken() {
    if (token) return;
    startTransition(async () => {
      const res = await getOrCreateCalendarToken();
      if (res.token) setToken(res.token);
    });
  }

  function rotate() {
    if (!confirm("تجديد الرابط سيوقف الاشتراكات السابقة على هذا التقويم. متابعة؟")) return;
    startTransition(async () => {
      const res = await regenerateCalendarToken();
      if (res.token) {
        setToken(res.token);
        setCopied(false);
      }
    });
  }

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {/* clipboard unavailable */}
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 text-white flex items-center justify-center text-xl">
          📅
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-emerald-900">{calendarName || "تقويم الأكاديمية"}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            اشترك بالتقويم في Google Calendar / Apple / Outlook ليظهر جدولك (تدريبات + مباريات) تلقائياً ويُحدَّث كل ساعة.
          </p>
        </div>
      </div>

      {!token ? (
        <Button type="button" variant="default" onClick={ensureToken} disabled={pending}>
          {pending ? "جارٍ التجهيز..." : "🔗 إنشاء رابط الاشتراك"}
        </Button>
      ) : (
        <>
          {/* Quick Google add button */}
          <div className="flex flex-wrap gap-2">
            <a
              href={googleAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              📅 إضافة لـ Google Calendar
            </a>
            <Button type="button" size="sm" variant="outline" onClick={copyUrl}>
              {copied ? "✅ تم النسخ" : "📋 نسخ رابط .ics"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={rotate} disabled={pending} className="text-amber-700">
              🔄 تجديد الرابط
            </Button>
          </div>

          {/* URL preview (read-only) */}
          <div className="rounded-md bg-white border border-border p-2.5">
            <div className="text-[10px] text-muted-foreground font-semibold mb-1">رابط الـ ICS (للتطبيقات الأخرى):</div>
            <code dir="ltr" className="block text-[11px] text-emerald-800 break-all font-mono">
              {url}
            </code>
          </div>

          {/* Per-app instructions */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-emerald-800 hover:text-emerald-900">
              كيف أُضيف الرابط في Apple / Outlook؟
            </summary>
            <div className="mt-2 space-y-2 leading-relaxed">
              <p>
                <strong>Apple Calendar (آيفون / ماك):</strong> الإعدادات ← التقويم ← الحسابات ← إضافة حساب ← أخرى ← إضافة اشتراك تقويم ← الصق الرابط.
              </p>
              <p>
                <strong>Outlook:</strong> Calendar ← Add calendar ← Subscribe from web ← الصق الرابط.
              </p>
              <p className="text-amber-700">
                ⚠️ احتفظ بالرابط سرياً — أي شخص لديه الرابط يستطيع رؤية جدولك. اضغط "🔄 تجديد الرابط" لإلغاء الاشتراكات السابقة.
              </p>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
