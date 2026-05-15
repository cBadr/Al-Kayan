"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCalendarIntegration } from "./actions";

export function CalendarIntegrationForm({ settings }: { settings: any }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [enabled, setEnabled] = useState<boolean>(!!settings?.gcal_enabled);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          setMsg(null);
          const res = await saveCalendarIntegration(fd);
          if (res.error) setMsg({ kind: "err", text: res.error });
          else setMsg({ kind: "ok", text: "✅ تم حفظ إعدادات التقويم" });
        });
      }}
      className="space-y-4"
    >
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <span className="relative inline-block w-11 h-6">
          <input
            type="checkbox"
            name="gcal_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <span className="block w-11 h-6 rounded-full bg-muted peer-checked:bg-emerald-600 transition-colors" />
          <span className={`absolute top-0.5 ${enabled ? "right-[22px]" : "right-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} />
        </span>
        <span className="text-sm font-semibold">تفعيل مزامنة التقويم</span>
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="gcal_default_calendar_name">اسم التقويم الافتراضي</Label>
        <Input
          id="gcal_default_calendar_name"
          name="gcal_default_calendar_name"
          defaultValue={settings?.gcal_default_calendar_name ?? ""}
          placeholder="مثال: تقويم أكاديمية السلام"
          disabled={!enabled}
        />
        <p className="text-[11px] text-muted-foreground">
          يظهر في تطبيق تقويم المستخدم. اتركه فارغاً لاستخدام اسم اللاعب تلقائياً.
        </p>
      </div>

      <div className="rounded-md bg-emerald-50/40 border border-emerald-200 p-3 text-xs text-emerald-900 leading-relaxed">
        <p className="font-bold mb-1">📌 كيف يعمل؟</p>
        <p>
          عند التفعيل، يظهر للاعبين والمدربين والمدراء في صفحاتهم زر "📅 إضافة لـ Google Calendar" يولّد لكل مستخدم رابط <code dir="ltr" className="bg-white px-1 rounded">/api/calendar/&lt;token&gt;</code> فريد.
        </p>
        <p className="mt-1">
          عند الاشتراك، تظهر التدريبات والمباريات تلقائياً في تقويم Google / Apple / Outlook ويُحدَّث كل ساعة. كل مستخدم يستطيع تجديد رابطه لإلغاء الاشتراكات السابقة.
        </p>
      </div>

      {msg && (
        <div className={`text-sm rounded-md p-3 border ${
          msg.kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
        }`}>{msg.text}</div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "💾 حفظ إعدادات التقويم"}
        </Button>
      </div>
    </form>
  );
}
