"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGoogleIntegrations } from "./actions";

export function GoogleIntegrationsForm({ settings }: { settings: any }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [ga4Enabled, setGa4Enabled] = useState<boolean>(!!settings?.ga4_enabled);
  const [gscEnabled, setGscEnabled] = useState<boolean>(!!settings?.gsc_enabled);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          setMsg(null);
          const res = await saveGoogleIntegrations(fd);
          if (res.error) setMsg({ kind: "err", text: res.error });
          else setMsg({ kind: "ok", text: "✅ تم حفظ إعدادات التكاملات" });
        });
      }}
      className="space-y-6"
    >
      {/* General site info — used by sitemap, OG meta */}
      <Section title="🌐 معلومات الموقع العامة" subtitle="مطلوبة لـ sitemap والـ Search Console والـ social previews">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            name="site_url"
            label="رابط الموقع الكامل (مع https)"
            type="url"
            dir="ltr"
            placeholder="https://salama.example.com"
            defaultValue={settings?.site_url ?? ""}
          />
          <Field
            name="default_meta_description"
            label="وصف افتراضي (Meta Description)"
            placeholder="منصة عربية لإدارة أكاديميات كرة القدم"
            defaultValue={settings?.default_meta_description ?? ""}
          />
        </div>
      </Section>

      {/* GA4 */}
      <Section
        title="📊 Google Analytics 4"
        subtitle="تتبع الزيارات وسلوك المستخدمين على الصفحات العامة (الواجهة + الانضمام + الدخول). لا يُحمَّل على لوحات الأكاديميات."
      >
        <div className="space-y-3">
          <Toggle
            name="ga4_enabled"
            label="تفعيل Google Analytics 4"
            checked={ga4Enabled}
            onChange={setGa4Enabled}
          />
          <Field
            name="ga4_measurement_id"
            label="معرّف القياس (Measurement ID)"
            placeholder="G-XXXXXXXXXX"
            dir="ltr"
            defaultValue={settings?.ga4_measurement_id ?? ""}
            disabled={!ga4Enabled}
          />
          <Help>
            احصل على المعرّف من{" "}
            <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener" className="text-emerald-700 underline">
              Google Analytics → Admin → Data Streams → Web → Measurement ID
            </a>
            . التنسيق: <code dir="ltr" className="bg-muted/50 px-1 rounded">G-XXXXXXXXXX</code>.
          </Help>
        </div>
      </Section>

      {/* Search Console */}
      <Section
        title="🔍 Google Search Console"
        subtitle="إثبات ملكية الموقع لتظهر إحصائيات الفهرسة + كلمات البحث في حسابك على Search Console."
      >
        <div className="space-y-3">
          <Toggle
            name="gsc_enabled"
            label="تفعيل التحقق من Search Console"
            checked={gscEnabled}
            onChange={setGscEnabled}
          />
          <Field
            name="gsc_verification_token"
            label="رمز التحقق (Meta Tag content)"
            placeholder="abc123XYZ_verification_token..."
            dir="ltr"
            defaultValue={settings?.gsc_verification_token ?? ""}
            disabled={!gscEnabled}
          />
          <Help>
            في Search Console اختر "HTML Tag" لإثبات الملكية ⇐ انسخ الـ <code dir="ltr" className="bg-muted/50 px-1 rounded">content="..."</code>{" "}
            والصقه هنا (يمكنك لصق الـ meta tag كاملاً وسنستخرج الرمز تلقائياً).
            <br />
            بعد الحفظ، عُد إلى Search Console واضغط "Verify".
          </Help>
        </div>
      </Section>

      {/* SEO bonuses (auto-generated) */}
      <Section title="🗺 sitemap.xml + robots.txt" subtitle="يُوَلَّدان تلقائياً ولا يحتاجان إعداد. شارك الروابط في Google Search Console.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <UrlPreview label="sitemap.xml" path="/sitemap.xml" siteUrl={settings?.site_url} />
          <UrlPreview label="robots.txt" path="/robots.txt" siteUrl={settings?.site_url} />
        </div>
      </Section>

      {msg && (
        <div className={`text-sm rounded-md p-3 border ${
          msg.kind === "ok"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>{msg.text}</div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "💾 حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}

/* ============================================================================
   ATOMS
   ========================================================================= */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 sm:p-5 space-y-3">
      <div>
        <h4 className="font-bold text-emerald-900">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function Toggle({ name, label, checked, onChange }: {
  name: string; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <span className="relative inline-block w-11 h-6">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="block w-11 h-6 rounded-full bg-muted peer-checked:bg-emerald-600 transition-colors" />
        <span className={`absolute top-0.5 ${checked ? "right-[22px]" : "right-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground leading-relaxed">{children}</p>;
}

function UrlPreview({ label, path, siteUrl }: { label: string; path: string; siteUrl: string | null | undefined }) {
  const fullUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : `(اضبط رابط الموقع أعلاه أولاً)${path}`;
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-[11px] text-muted-foreground font-semibold">{label}</div>
      <code dir="ltr" className="block text-xs mt-1 break-all text-emerald-800">{fullUrl}</code>
    </div>
  );
}
