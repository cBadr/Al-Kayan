"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";

type Player = {
  id: string;
  code: string;
  full_name: string;
  position: string | null;
  status: string;
  suspension_reason: string | null;
  categories: { name: string } | null;
};
type Match = {
  id: string;
  opponent: string;
  match_date: string;
  our_score: number | null;
  their_score: number | null;
  match_type: string;
};
type Part = {
  match_id: string;
  player_id: string;
  lineup_role: "starting" | "bench" | "unused";
  minutes_played: number;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  sent_off: boolean;
};

type View = "summary" | "discipline" | "minutes" | "all";

export function ReportsPrintable({
  academyName,
  academyAddress,
  academyPhone,
  logoUrl,
  players,
  matches,
  parts,
  discipline,
  matchSummary,
  attSummary,
  filters,
  view,
  academyId,
}: {
  academyName: string;
  academyAddress: string | null;
  academyPhone: string | null;
  logoUrl: string | null;
  players: Player[];
  matches: Match[];
  parts: Part[];
  discipline: Record<string, any>;
  matchSummary: Record<string, any>;
  attSummary: Record<string, any>;
  filters: string[];
  view: View;
  academyId: string;
}) {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<View>(view);

  const partsMap = useMemo(() => {
    const m = new Map<string, Part>();
    for (const p of parts) m.set(`${p.player_id}:${p.match_id}`, p);
    return m;
  }, [parts]);

  const showSummary = selectedView === "all" || selectedView === "summary";
  const showDiscipline = selectedView === "all" || selectedView === "discipline";
  const showMinutes = selectedView === "all" || selectedView === "minutes";

  return (
    <div className="bg-white text-emerald-950 min-h-screen">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="max-w-[297mm] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="h-9 px-3 rounded-md border border-border hover:bg-muted text-sm font-medium"
            >
              ← العودة
            </button>
            <h1 className="font-bold">طباعة تقارير اللاعبين</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
            >
              🖨 طباعة
            </button>
          </div>
        </div>
        <div className="max-w-[297mm] mx-auto px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground mb-2">اختر الأقسام للطباعة:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { v: "all", label: "كل التقارير" },
              { v: "summary", label: "📋 الملخص فقط" },
              { v: "discipline", label: "🟨 مصفوفة الإنذارات" },
              { v: "minutes", label: "⏱ مصفوفة الدقائق" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setSelectedView(opt.v as View)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedView === opt.v
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable sheet */}
      <div className="report-sheet mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0">
        {/* Letterhead */}
        <header className="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xl">
                {academyName.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-lg font-black text-emerald-900">{academyName}</div>
              <div className="text-xs text-muted-foreground">{academyAddress ?? ""}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">{academyPhone ?? ""}</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">تقرير اللاعبين</div>
            <div className="text-base font-bold text-emerald-900 mt-1">
              {players.length} لاعب · {matches.length} مباراة
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">طُبع في {formatDate(new Date().toISOString(), true)}</div>
          </div>
        </header>

        {/* Filters summary */}
        {filters.length > 0 && (
          <section className="mb-4 print-keep">
            <h2 className="text-xs font-black text-emerald-700 mb-1">الفلاتر المطبَّقة:</h2>
            <div className="flex flex-wrap gap-2">
              {filters.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50">
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Summary table */}
        {showSummary && (
          <section className="mb-6 print-keep">
            <h2 className="text-sm font-black text-emerald-700 border-b border-emerald-200 pb-1 mb-3">📋 ملخص اللاعبين</h2>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-emerald-50">
                  <Th>#</Th>
                  <Th>الكود</Th>
                  <Th>الاسم</Th>
                  <Th>المركز</Th>
                  <Th>التصنيف</Th>
                  <Th>الحالة</Th>
                  <Th>حضور %</Th>
                  <Th>مباريات</Th>
                  <Th>أهداف</Th>
                  <Th>صفراء نشطة</Th>
                  <Th>إجمالي صفراء</Th>
                  <Th>حمراء</Th>
                  <Th>دقائق</Th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr><td colSpan={13} className="text-center text-muted-foreground p-4">لا توجد بيانات</td></tr>
                ) : players.map((p, i) => {
                  const d = discipline[p.id] ?? {};
                  const ms = matchSummary[p.id] ?? {};
                  const a = attSummary[p.id] ?? {};
                  return (
                    <tr key={p.id} className={p.status === "suspended" ? "bg-red-50" : ""}>
                      <Td className="text-center">{i + 1}</Td>
                      <Td className="font-mono text-center">{p.code}</Td>
                      <Td className="font-semibold">{p.full_name}</Td>
                      <Td>{posLabel(p.position)}</Td>
                      <Td>{p.categories?.name ?? "—"}</Td>
                      <Td>{statusLabel(p.status)}</Td>
                      <Td className="text-center">{a.attendance_pct ?? 0}%</Td>
                      <Td className="text-center">{ms.matches_played ?? 0}</Td>
                      <Td className="text-center font-bold text-emerald-700">{ms.goals ?? 0}</Td>
                      <Td className="text-center">
                        <strong className={
                          (d.active_yellows ?? 0) >= 3 ? "text-red-600" :
                          (d.active_yellows ?? 0) === 2 ? "text-amber-600" : ""
                        }>
                          {d.active_yellows ?? 0}/3
                        </strong>
                      </Td>
                      <Td className="text-center">{d.total_yellows ?? 0}</Td>
                      <Td className="text-center text-red-600">{d.total_reds ?? 0}</Td>
                      <Td className="text-center">{d.total_minutes ?? 0}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Discipline matrix */}
        {showDiscipline && matches.length > 0 && (
          <section className="mb-6 page-break-before">
            <h2 className="text-sm font-black text-emerald-700 border-b border-emerald-200 pb-1 mb-3">🟨 مصفوفة الإنذارات والطرد</h2>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-emerald-50">
                  <Th className="w-8">#</Th>
                  <Th>الاسم</Th>
                  {matches.map((m) => (
                    <Th key={m.id} className="text-center" style={{ writingMode: "vertical-rl", whiteSpace: "nowrap" }}>
                      {m.opponent} · {formatDate(m.match_date)}
                    </Th>
                  ))}
                  <Th className="bg-amber-100 text-center">إجمالي 🟨</Th>
                  <Th className="bg-red-100 text-center">إجمالي 🟥</Th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  let totalY = 0, totalR = 0;
                  return (
                    <tr key={p.id} className={p.status === "suspended" ? "bg-red-50" : ""}>
                      <Td className="text-center">{i + 1}</Td>
                      <Td className="font-medium">{p.full_name}</Td>
                      {matches.map((m) => {
                        const part = partsMap.get(`${p.id}:${m.id}`);
                        totalY += part?.yellow_cards ?? 0;
                        totalR += part?.red_cards ?? 0;
                        return (
                          <Td key={m.id} className="text-center">
                            {part ? (
                              <>
                                {part.yellow_cards > 0 && <span className="bg-amber-400 text-emerald-950 px-1 rounded text-[9px] font-bold">إنذار{part.yellow_cards > 1 ? `×${part.yellow_cards}` : ""}</span>}
                                {part.red_cards > 0 && <span className="bg-red-600 text-white px-1 rounded text-[9px] font-bold">طرد</span>}
                                {!part.yellow_cards && !part.red_cards && part.lineup_role !== "unused" && "✓"}
                              </>
                            ) : "—"}
                          </Td>
                        );
                      })}
                      <Td className="text-center font-bold bg-amber-50">{totalY}</Td>
                      <Td className="text-center font-bold text-red-600 bg-red-50">{totalR}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Minutes matrix */}
        {showMinutes && matches.length > 0 && (
          <section className="mb-6 page-break-before">
            <h2 className="text-sm font-black text-emerald-700 border-b border-emerald-200 pb-1 mb-3">⏱ مصفوفة الدقائق والمشاركات</h2>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-emerald-50">
                  <Th className="w-8">#</Th>
                  <Th>الاسم</Th>
                  {matches.map((m) => (
                    <Th key={m.id} className="text-center" style={{ writingMode: "vertical-rl", whiteSpace: "nowrap" }}>
                      {m.opponent} · {formatDate(m.match_date)}
                    </Th>
                  ))}
                  <Th className="text-center">إجمالي ⏱</Th>
                  <Th className="text-center">إجمالي ⚽</Th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  let totalMin = 0, totalG = 0;
                  return (
                    <tr key={p.id}>
                      <Td className="text-center">{i + 1}</Td>
                      <Td className="font-medium">{p.full_name}</Td>
                      {matches.map((m) => {
                        const part = partsMap.get(`${p.id}:${m.id}`);
                        const min = part?.minutes_played ?? 0;
                        totalMin += min;
                        totalG += part?.goals ?? 0;
                        return (
                          <Td key={m.id} className={`text-center ltr-numbers ${
                            !part ? "text-muted-foreground" :
                            part.lineup_role === "starting" ? "bg-emerald-50" :
                            part.lineup_role === "bench" ? "bg-amber-50" : ""
                          }`}>
                            {part ? min : "—"}
                            {part?.goals ? <div className="text-[8px] text-emerald-700">⚽{part.goals}</div> : null}
                          </Td>
                        );
                      })}
                      <Td className="text-center font-bold bg-emerald-100">{totalMin}</Td>
                      <Td className="text-center font-bold text-emerald-700">{totalG}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Signatures */}
        <footer className="mt-8 pt-4 border-t border-emerald-200 grid grid-cols-3 gap-6 text-center text-[11px]">
          <SignatureLine label="المدرب" />
          <SignatureLine label="المدير الفني" />
          <SignatureLine label="ختم الأكاديمية" />
        </footer>
      </div>

      <style jsx global>{`
        .report-sheet {
          width: 297mm;
          padding: 12mm 14mm 14mm 14mm;
          box-sizing: border-box;
          font-family: inherit;
        }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .report-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            width: 297mm !important;
          }
          section.print-keep, .print-keep {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .page-break-before {
            break-before: page;
            page-break-before: always;
          }
          tr { break-inside: avoid; page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </div>
  );
}

function Th({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <th className={`p-1.5 border border-emerald-200 text-right whitespace-nowrap ${className}`} style={style}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-1.5 border border-emerald-100 ${className}`}>{children}</td>;
}
function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="border-b border-emerald-300 h-10 mb-1" />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function posLabel(p: string | null) {
  if (!p) return "—";
  return ({ GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}
function statusLabel(s: string) {
  return ({ active: "نشط", suspended: "موقوف", archived: "مؤرشف" } as any)[s] ?? s;
}
