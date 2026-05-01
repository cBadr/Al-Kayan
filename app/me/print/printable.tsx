"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type SectionKey =
  | "personal"
  | "performance"
  | "matches"
  | "attendance"
  | "discipline"
  | "subscriptions";

const SECTION_LABELS: Record<SectionKey, string> = {
  personal: "البيانات الشخصية",
  performance: "ملخص الأداء",
  matches: "سجل المباريات",
  attendance: "سجل الحضور",
  discipline: "اللعب النظيف",
  subscriptions: "الاشتراكات",
};

const DEFAULT_SECTIONS: SectionKey[] = ["personal", "performance", "matches", "attendance", "discipline", "subscriptions"];

export function MePrintable({
  player: p, photoUrl, logoUrl, sealUrl, signatureUrl, managerName,
  subs, attRecords, matchParts, discipline, attSummary, matchSummary,
}: {
  player: any;
  photoUrl: string | null;
  logoUrl: string | null;
  sealUrl: string | null;
  signatureUrl: string | null;
  managerName: string | null;
  subs: any[];
  attRecords: any[];
  matchParts: any[];
  discipline: any;
  attSummary: any;
  matchSummary: any;
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Set<SectionKey>>(new Set(DEFAULT_SECTIONS));

  const toggle = (k: SectionKey) =>
    setSections((s) => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const has = (k: SectionKey) => sections.has(k);
  const fairPlayScore = (() => {
    const reds = discipline?.total_reds ?? 0;
    const yellows = discipline?.total_yellows ?? 0;
    const matches = discipline?.matches_called ?? 0;
    if (matches === 0) return 100;
    const penalty = (yellows * 5) + (reds * 15);
    return Math.max(0, 100 - Math.round(penalty / Math.max(1, matches)));
  })();

  return (
    <div className="bg-white text-emerald-950 min-h-screen">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="h-9 px-3 rounded-md border border-border hover:bg-muted text-sm font-medium"
            >
              ← العودة
            </button>
            <h1 className="font-bold">طباعة بطاقة اللاعب</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
          >
            🖨 طباعة
          </button>
        </div>

        <div className="max-w-[210mm] mx-auto px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground mb-2">اختر الأقسام التي تريد طباعتها:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
              <label
                key={k}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  has(k) ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-border hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={has(k)}
                  onChange={() => toggle(k)}
                />
                {SECTION_LABELS[k]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="print-sheet mx-auto my-6 bg-white shadow-lg print:shadow-none print:my-0">
        {/* Letterhead */}
        <header className="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xl">
                {p.academies?.name?.charAt(0) ?? "S"}
              </div>
            )}
            <div>
              <div className="text-lg font-black text-emerald-900">{p.academies?.name}</div>
              <div className="text-xs text-muted-foreground">{p.academies?.address ?? ""}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">{p.academies?.phone ?? ""}</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">بطاقة اللاعب</div>
            <div className="text-2xl font-black ltr-numbers font-mono">#{p.code}</div>
            <div className="text-[10px] text-muted-foreground">طُبع في {formatDate(new Date().toISOString(), true)}</div>
          </div>
        </header>

        {/* Hero */}
        <section className="flex items-start gap-5 mb-5 print-keep">
          <div className="w-28 h-28 rounded-lg overflow-hidden border-2 border-emerald-700/20 bg-muted shrink-0">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground font-black">
                {p.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black text-emerald-950 leading-tight">{p.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {p.categories?.name ?? "بدون تصنيف"} · {posLabel(p.position)}
              {p.preferred_jersey && <> · قميص رقم <span className="ltr-numbers">{p.preferred_jersey}</span></>}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-3">
              <KV k="تاريخ الميلاد" v={formatDate(p.birth_date)} />
              <KV k="تاريخ الانضمام" v={formatDate(p.joined_at)} />
              <KV k="الهاتف" v={p.phone || "—"} />
              <KV k="البريد" v={p.email || "—"} />
            </div>
          </div>
        </section>

        {has("personal") && (
          <Section title="البيانات الشخصية">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <KV k="الاسم رباعي" v={p.full_name} />
              <KV k="الكود" v={p.code} />
              <KV k="تاريخ الميلاد" v={formatDate(p.birth_date)} />
              <KV k="الرقم القومي" v={p.national_id || "—"} />
              <KV k="الهاتف" v={p.phone || "—"} />
              <KV k="البريد" v={p.email || "—"} />
              <KV k="ولي الأمر" v={p.guardian_name || "—"} />
              <KV k="هاتف ولي الأمر" v={p.guardian_phone || "—"} />
              <KV k="التصنيف" v={p.categories?.name ?? "—"} />
              <KV k="المركز" v={posLabel(p.position) || "—"} />
            </div>
          </Section>
        )}

        {has("performance") && (
          <Section title="ملخص الأداء">
            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat label="المباريات" value={String(matchSummary?.matches_played ?? 0)} />
              <Stat label="الأهداف" value={String(matchSummary?.goals ?? 0)} />
              <Stat label="إجمالي الدقائق" value={String(discipline?.total_minutes ?? 0)} />
              <Stat label="نسبة الحضور" value={`${attSummary?.attendance_pct ?? 0}%`} />
            </div>
          </Section>
        )}

        {has("matches") && (
          <Section title="سجل المباريات">
            {matchParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مشاركات</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-right">
                    <th className="p-2 border border-emerald-200">التاريخ</th>
                    <th className="p-2 border border-emerald-200">الخصم</th>
                    <th className="p-2 border border-emerald-200">النتيجة</th>
                    <th className="p-2 border border-emerald-200">الدور</th>
                    <th className="p-2 border border-emerald-200">دقائق</th>
                    <th className="p-2 border border-emerald-200">أهداف</th>
                    <th className="p-2 border border-emerald-200">🟨</th>
                    <th className="p-2 border border-emerald-200">🟥</th>
                  </tr>
                </thead>
                <tbody>
                  {matchParts.map((mp: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2 border border-emerald-100">{formatDate(mp.matches?.match_date)}</td>
                      <td className="p-2 border border-emerald-100 font-medium">{mp.matches?.opponent}</td>
                      <td className="p-2 border border-emerald-100 ltr-numbers">{mp.matches?.our_score ?? "-"} : {mp.matches?.their_score ?? "-"}</td>
                      <td className="p-2 border border-emerald-100">
                        {mp.lineup_role === "starting" ? "أساسي" : mp.lineup_role === "bench" ? "احتياطي" : "—"}
                        {mp.is_captain ? " ★" : ""}
                      </td>
                      <td className="p-2 border border-emerald-100 text-center">{mp.minutes_played ?? 0}</td>
                      <td className="p-2 border border-emerald-100 text-center">{mp.goals ?? 0}</td>
                      <td className="p-2 border border-emerald-100 text-center">{mp.yellow_cards ?? 0}</td>
                      <td className="p-2 border border-emerald-100 text-center">{mp.red_cards ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )}

        {has("attendance") && (
          <Section title="سجل الحضور">
            <div className="grid grid-cols-4 gap-3 text-center mb-3">
              <Stat label="نسبة الحضور" value={`${attSummary?.attendance_pct ?? 0}%`} />
              <Stat label="حضور" value={String(attSummary?.present_count ?? 0)} />
              <Stat label="غياب" value={String(attSummary?.absent_count ?? 0)} />
              <Stat label="تأخير" value={String(attSummary?.late_count ?? 0)} />
            </div>
            {attRecords.length > 0 && (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-right">
                    <th className="p-2 border border-emerald-200">التاريخ</th>
                    <th className="p-2 border border-emerald-200">الموقع</th>
                    <th className="p-2 border border-emerald-200">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {attRecords.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2 border border-emerald-100">{formatDate(r.trainings?.scheduled_at)}</td>
                      <td className="p-2 border border-emerald-100">{r.trainings?.location ?? "—"}</td>
                      <td className="p-2 border border-emerald-100">
                        {r.status === "present" ? "حاضر" :
                         r.status === "late" ? "متأخر" :
                         r.status === "excused" ? "بعذر" : "غائب"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )}

        {has("discipline") && (
          <Section title="مؤشر اللعب النظيف">
            <div className="text-center py-2 mb-3">
              <div className="text-5xl font-black text-emerald-700 ltr-numbers inline-block">{fairPlayScore}</div>
              <span className="text-muted-foreground ms-1">/ 100</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="إجمالي صفراء" value={String(discipline?.total_yellows ?? 0)} />
              <Stat label="إجمالي حمراء" value={String(discipline?.total_reds ?? 0)} />
              <Stat label="صفراء نشطة" value={`${discipline?.active_yellows ?? 0}/3`} />
            </div>
          </Section>
        )}

        {has("subscriptions") && (
          <Section title="الاشتراكات والإيصالات">
            {subs.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد إيصالات</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-right">
                    <th className="p-2 border border-emerald-200">الفترة</th>
                    <th className="p-2 border border-emerald-200">المستحق</th>
                    <th className="p-2 border border-emerald-200">المدفوع</th>
                    <th className="p-2 border border-emerald-200">المتبقي</th>
                    <th className="p-2 border border-emerald-200">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s: any) => {
                    const remaining = Number(s.amount_due) - Number(s.amount_paid);
                    return (
                      <tr key={s.id}>
                        <td className="p-2 border border-emerald-100" dir="ltr">
                          {formatDate(s.period_start)} → {formatDate(s.period_end)}
                        </td>
                        <td className="p-2 border border-emerald-100">{formatCurrency(s.amount_due)}</td>
                        <td className="p-2 border border-emerald-100">{formatCurrency(s.amount_paid)}</td>
                        <td className="p-2 border border-emerald-100">{formatCurrency(remaining)}</td>
                        <td className="p-2 border border-emerald-100">
                          {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Section>
        )}

        {/* Signatures */}
        <footer className="mt-10 pt-6 border-t border-emerald-200 grid grid-cols-3 gap-6 text-center text-xs">
          <SignatureLine label="ولي الأمر" />
          <SignatureLine
            label={managerName ? `المدير / ${managerName}` : "المدير"}
            imageUrl={signatureUrl}
            type="signature"
          />
          <SignatureLine label="ختم الأكاديمية" imageUrl={sealUrl} type="seal" />
        </footer>
      </div>

      <style jsx global>{`
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm 14mm 18mm 14mm;
          box-sizing: border-box;
        }
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          .print-keep { break-inside: avoid; page-break-inside: avoid; }
          section { break-inside: avoid; page-break-inside: avoid; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 print-keep">
      <h3 className="text-sm font-black uppercase tracking-wider text-emerald-700 border-b border-emerald-200 pb-1 mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-emerald-950">{v}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-2">
      <div className="text-2xl font-black text-emerald-800 ltr-numbers">{value}</div>
      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">{label}</div>
    </div>
  );
}

function SignatureLine({ label, imageUrl, type }: { label: string; imageUrl?: string | null; type?: "signature" | "seal" }) {
  return (
    <div>
      <div className="relative border-b border-emerald-300 h-16 mb-1 flex items-end justify-center">
        {imageUrl && (
          <span className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={label}
              className={type === "seal" ? "max-h-16 max-w-20 object-contain opacity-90" : "max-h-14 max-w-32 object-contain"}
            />
          </span>
        )}
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function posLabel(p: string | null) {
  if (!p) return "";
  return ({ GK: "حارس مرمى", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}
