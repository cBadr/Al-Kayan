"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Player = {
  id: string;
  code: string;
  full_name: string;
  position: string | null;
  status: string;
  suspension_reason: string | null;
  category_id: string | null;
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

export function PlayerReports({
  view,
  players,
  matches,
  parts,
  discipline,
  matchSummary,
  attSummary,
  roi,
  academyId,
}: {
  view: "summary" | "discipline" | "minutes";
  players: Player[];
  matches: Match[];
  parts: Part[];
  discipline: Record<string, any>;
  matchSummary: Record<string, any>;
  attSummary: Record<string, any>;
  roi: Record<string, any>;
  academyId: string;
}) {
  // Build (player, match) → participation map
  const partsMap = useMemo(() => {
    const m = new Map<string, Part>();
    for (const p of parts) m.set(`${p.player_id}:${p.match_id}`, p);
    return m;
  }, [parts]);

  function exportCsv() {
    const rows: string[][] = [];
    if (view === "summary") {
      rows.push(["الكود", "الاسم", "المركز", "التصنيف", "الحالة",
        "حضور %", "حاضر", "غائب", "متأخر",
        "مباريات", "أهداف", "صفراء (نشطة)", "إجمالي صفراء", "حمراء", "دقائق"]);
      for (const p of players) {
        const d = discipline[p.id] ?? {};
        const ms = matchSummary[p.id] ?? {};
        const a = attSummary[p.id] ?? {};
        rows.push([
          p.code, p.full_name, posLabel(p.position), p.categories?.name ?? "",
          statusLabel(p.status),
          `${a.attendance_pct ?? 0}%`,
          String(a.present_count ?? 0), String(a.absent_count ?? 0), String(a.late_count ?? 0),
          String(ms.matches_played ?? 0), String(ms.goals ?? 0),
          String(d.active_yellows ?? 0), String(d.total_yellows ?? 0),
          String(d.total_reds ?? 0), String(d.total_minutes ?? 0),
        ]);
      }
    } else {
      const header = ["الكود", "الاسم"];
      for (const m of matches) header.push(`${formatDate(m.match_date)} ضد ${m.opponent}`);
      header.push(view === "discipline" ? "إجمالي بطاقات" : "إجمالي دقائق");
      rows.push(header);
      for (const p of players) {
        const row = [p.code, p.full_name];
        let total = 0;
        for (const m of matches) {
          const part = partsMap.get(`${p.id}:${m.id}`);
          if (view === "discipline") {
            const cells: string[] = [];
            if (part?.yellow_cards) cells.push(`صفراء×${part.yellow_cards}`);
            if (part?.red_cards) cells.push("طرد");
            if (part?.sent_off) cells.push("طرد");
            row.push(cells.join(" + "));
            total += (part?.yellow_cards ?? 0) + (part?.red_cards ?? 0);
          } else {
            row.push(part ? String(part.minutes_played ?? 0) : "—");
            total += part?.minutes_played ?? 0;
          }
        }
        row.push(String(total));
        rows.push(row);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `player-report-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-end gap-2 mb-3 no-print">
          <Button variant="outline" onClick={exportCsv}>📥 تصدير CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>🖨 طباعة</Button>
        </div>

        {view === "summary" && <SummaryTable
          players={players} discipline={discipline} matchSummary={matchSummary}
          attSummary={attSummary} roi={roi} academyId={academyId}
        />}
        {view === "discipline" && <DisciplineMatrix
          players={players} matches={matches} partsMap={partsMap}
        />}
        {view === "minutes" && <MinutesMatrix
          players={players} matches={matches} partsMap={partsMap}
        />}
      </CardContent>
    </Card>
  );
}

function SummaryTable({ players, discipline, matchSummary, attSummary, roi, academyId }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-emerald-50 text-right">
            <Th>الكود</Th>
            <Th>الاسم</Th>
            <Th>المركز</Th>
            <Th>التصنيف</Th>
            <Th>الحالة</Th>
            <Th>الحضور</Th>
            <Th>المباريات</Th>
            <Th>الأهداف</Th>
            <Th>الصفراء النشطة</Th>
            <Th>الحمراء</Th>
            <Th>الدقائق</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr><td colSpan={12} className="text-center text-muted-foreground py-6">لا توجد بيانات</td></tr>
          ) : players.map((p: Player) => {
            const d = discipline[p.id] ?? {};
            const ms = matchSummary[p.id] ?? {};
            const a = attSummary[p.id] ?? {};
            const activeY = d.active_yellows ?? 0;
            return (
              <tr key={p.id} className={`border-b border-border hover:bg-muted/30 ${
                p.status === "suspended" ? "bg-red-50/50" : ""
              }`}>
                <Td className="ltr-numbers font-mono text-xs">{p.code}</Td>
                <Td className="font-medium">
                  <Link href={`/academy/${academyId}/players/${p.id}`} className="hover:underline">
                    {p.full_name}
                  </Link>
                  {p.suspension_reason && (
                    <div className="text-[10px] text-red-600 mt-0.5">⚠ {p.suspension_reason}</div>
                  )}
                </Td>
                <Td>{posLabel(p.position)}</Td>
                <Td className="text-xs">{p.categories?.name ?? "—"}</Td>
                <Td>
                  <Badge variant={
                    p.status === "active" ? "success" :
                    p.status === "suspended" ? "destructive" : "muted"
                  }>{statusLabel(p.status)}</Badge>
                </Td>
                <Td className="ltr-numbers">{a.attendance_pct ?? 0}%</Td>
                <Td>{ms.matches_played ?? 0}</Td>
                <Td className="font-semibold text-emerald-700">{ms.goals ?? 0}</Td>
                <Td>
                  <span className={activeY >= 3 ? "text-red-600 font-bold" :
                                  activeY === 2 ? "text-amber-600 font-bold" : ""}>
                    {activeY}/3
                  </span>
                  {activeY >= 2 && activeY < 3 && <span className="ms-1 text-[10px] text-amber-600">⚠ تحذير</span>}
                  {activeY >= 3 && <span className="ms-1 text-[10px] text-red-600">🚫 إيقاف</span>}
                </Td>
                <Td className="text-red-600">{d.total_reds ?? 0}</Td>
                <Td className="ltr-numbers">{d.total_minutes ?? 0}</Td>
                <Td className="no-print">
                  <div className="flex gap-2">
                    <Link href={`/academy/${academyId}/players/${p.id}`}
                          className="text-emerald-700 text-xs hover:underline">عرض</Link>
                    <Link href={`/academy/${academyId}/reports/print?player=${p.id}`}
                          className="text-emerald-700 text-xs hover:underline">🖨</Link>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DisciplineMatrix({ players, matches, partsMap }: { players: Player[]; matches: Match[]; partsMap: Map<string, Part> }) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">
      لا توجد مباريات في النطاق الزمني المحدد. اضبط فلاتر التاريخ أعلاه.
    </p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            <th className="sticky right-0 bg-emerald-100 border border-emerald-200 p-2 text-right whitespace-nowrap">#</th>
            <th className="sticky right-12 bg-emerald-100 border border-emerald-200 p-2 text-right whitespace-nowrap">الاسم</th>
            {matches.map((m) => (
              <th key={m.id} className="border border-emerald-200 p-2 bg-emerald-50 whitespace-nowrap">
                <div className="text-[10px] text-muted-foreground" dir="ltr">{formatDate(m.match_date)}</div>
                <div className="font-bold">{m.opponent}</div>
              </th>
            ))}
            <th className="border border-emerald-200 p-2 bg-amber-50 whitespace-nowrap">إجمالي الصفراء</th>
            <th className="border border-emerald-200 p-2 bg-red-50 whitespace-nowrap">إجمالي الحمراء</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => {
            let totalY = 0, totalR = 0;
            return (
              <tr key={p.id} className={p.status === "suspended" ? "bg-red-50/50" : ""}>
                <td className="sticky right-0 bg-white border border-emerald-100 p-2 text-center font-mono ltr-numbers">{idx + 1}</td>
                <td className="sticky right-12 bg-white border border-emerald-100 p-2 font-medium whitespace-nowrap">
                  {p.full_name}
                  {p.status === "suspended" && <Badge className="ms-1" variant="destructive">موقوف</Badge>}
                </td>
                {matches.map((m) => {
                  const part = partsMap.get(`${p.id}:${m.id}`);
                  totalY += part?.yellow_cards ?? 0;
                  totalR += part?.red_cards ?? 0;
                  return (
                    <td key={m.id} className="border border-emerald-100 p-1 text-center bg-white">
                      {part ? <DisciplineCell part={part} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
                <td className="border border-emerald-100 p-2 text-center font-bold bg-amber-50/40 ltr-numbers">{totalY}</td>
                <td className="border border-emerald-100 p-2 text-center font-bold bg-red-50/40 ltr-numbers text-red-600">{totalR}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DisciplineCell({ part }: { part: Part }) {
  if (part.lineup_role === "unused") return <span className="text-muted-foreground">—</span>;
  const items: React.ReactNode[] = [];
  if (part.yellow_cards > 0) {
    items.push(
      <span key="y" className="inline-block bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded text-[10px] font-bold">
        إنذار{part.yellow_cards > 1 ? `×${part.yellow_cards}` : ""}
      </span>
    );
  }
  if (part.red_cards > 0 || part.sent_off) {
    items.push(
      <span key="r" className="inline-block bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
        طرد
      </span>
    );
  }
  if (items.length === 0) {
    return <span className="text-emerald-600">✓</span>;
  }
  return <div className="flex flex-col gap-0.5 items-center">{items}</div>;
}

function MinutesMatrix({ players, matches, partsMap }: { players: Player[]; matches: Match[]; partsMap: Map<string, Part> }) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">
      لا توجد مباريات في النطاق الزمني المحدد.
    </p>;
  }

  // Compute totals per match (across players) for footer summary row
  const matchTotals = matches.map((m) => {
    let totalMin = 0;
    let totalG = 0;
    let starting = 0;
    let bench = 0;
    for (const p of players) {
      const part = partsMap.get(`${p.id}:${m.id}`);
      if (!part) continue;
      totalMin += part.minutes_played ?? 0;
      totalG += part.goals ?? 0;
      if (part.lineup_role === "starting") starting++;
      else if (part.lineup_role === "bench") bench++;
    }
    return { totalMin, totalG, starting, bench };
  });

  // Color ramp by minutes (0–90+):
  const minuteCellClass = (min: number, role?: string) => {
    if (!role || role === "unused") return "bg-muted/20 text-muted-foreground";
    if (min >= 80) return "bg-emerald-300 text-emerald-950 font-bold";
    if (min >= 45) return "bg-emerald-100 text-emerald-900 font-semibold";
    if (min >= 15) return "bg-emerald-50 text-emerald-800";
    if (min > 0) return "bg-amber-50 text-amber-800";
    return "bg-muted/30 text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground no-print">
        <LegendChip cls="bg-emerald-300" label="أساسي 80+ د" />
        <LegendChip cls="bg-emerald-100" label="45–79 د" />
        <LegendChip cls="bg-emerald-50" label="15–44 د" />
        <LegendChip cls="bg-amber-50" label="1–14 د" />
        <LegendChip cls="bg-muted/30" label="لم يشارك" />
        <span className="ms-auto">⚽ = أهداف · 🟨 = إنذار · 🟥 = طرد</span>
      </div>

      <div className="overflow-auto max-h-[70vh] border border-emerald-200 rounded-lg">
        <table className="text-xs border-collapse min-w-full bg-white">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky right-0 z-20 bg-emerald-700 text-white border border-emerald-700 p-2 text-center w-10">#</th>
              <th className="sticky right-10 z-20 bg-emerald-700 text-white border border-emerald-700 p-2 text-right whitespace-nowrap min-w-44">اللاعب</th>
              <th className="bg-emerald-700 text-white border border-emerald-700 p-2 text-center whitespace-nowrap">المركز</th>
              {matches.map((m) => {
                const r = (m.our_score == null || m.their_score == null) ? null
                  : m.our_score > m.their_score ? "win"
                  : m.our_score < m.their_score ? "loss" : "draw";
                return (
                  <th key={m.id} className={`border border-emerald-700 p-2 whitespace-nowrap text-white ${
                    r === "win" ? "bg-emerald-600" : r === "loss" ? "bg-red-600" : r === "draw" ? "bg-gray-500" : "bg-emerald-700"
                  }`}>
                    <div className="text-[10px] opacity-90" dir="ltr">{formatDate(m.match_date)}</div>
                    <div className="font-bold text-sm">{m.opponent}</div>
                    {m.our_score != null && (
                      <div className="text-[10px] opacity-90 ltr-numbers mt-0.5">{m.our_score} : {m.their_score}</div>
                    )}
                    <div className="text-[9px] opacity-80 mt-0.5">{m.match_type === "home" ? "🏠" : "✈️"}</div>
                  </th>
                );
              })}
              <th className="bg-emerald-700 text-white border border-emerald-700 p-2 whitespace-nowrap">⏱ إجمالي<br />الدقائق</th>
              <th className="bg-emerald-700 text-white border border-emerald-700 p-2 whitespace-nowrap">⚽ الأهداف</th>
              <th className="bg-emerald-700 text-white border border-emerald-700 p-2 whitespace-nowrap">📋 المباريات</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => {
              let totalMin = 0, totalG = 0, totalMatches = 0;
              return (
                <tr key={p.id} className={`${p.status === "suspended" ? "bg-red-50/40" : idx % 2 ? "bg-white" : "bg-emerald-50/15"}`}>
                  <td className="sticky right-0 z-10 bg-inherit border border-emerald-100 p-1 text-center font-mono text-muted-foreground ltr-numbers">{idx + 1}</td>
                  <td className="sticky right-10 z-10 bg-inherit border border-emerald-100 p-2 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{p.full_name}</span>
                      {p.status === "suspended" && <span className="text-[9px] bg-red-600 text-white px-1 rounded">موقوف</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono ltr-numbers">{p.code}</div>
                  </td>
                  <td className="border border-emerald-100 p-1 text-center text-[10px] text-muted-foreground">{posLabel(p.position)}</td>
                  {matches.map((m) => {
                    const part = partsMap.get(`${p.id}:${m.id}`);
                    const min = part?.minutes_played ?? 0;
                    if (part) {
                      totalMin += min;
                      totalG += part.goals ?? 0;
                      if (part.lineup_role === "starting" || part.lineup_role === "bench") totalMatches++;
                    }
                    return (
                      <td
                        key={m.id}
                        className={`border border-emerald-100 p-1 text-center ltr-numbers ${minuteCellClass(min, part?.lineup_role)}`}
                        title={part ? `${part.lineup_role === "starting" ? "أساسي" : part.lineup_role === "bench" ? "احتياطي" : "—"} · ${min} د` : "لم يستدعَ"}
                      >
                        <div className="font-bold text-sm">{part ? min : "—"}</div>
                        {part && (part.goals > 0 || part.yellow_cards > 0 || part.red_cards > 0) && (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5 text-[9px]">
                            {part.goals > 0 && <span className="text-emerald-700 font-bold">⚽{part.goals}</span>}
                            {part.yellow_cards > 0 && <span className="text-amber-600 font-bold">🟨{part.yellow_cards}</span>}
                            {part.red_cards > 0 && <span className="text-red-600 font-bold">🟥{part.red_cards}</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-emerald-100 p-2 text-center font-black bg-emerald-100 text-emerald-900 ltr-numbers">{totalMin}</td>
                  <td className="border border-emerald-100 p-2 text-center font-black ltr-numbers text-emerald-700">{totalG}</td>
                  <td className="border border-emerald-100 p-2 text-center font-bold ltr-numbers text-emerald-900">{totalMatches}</td>
                </tr>
              );
            })}
            {/* Footer totals row */}
            <tr className="bg-emerald-100 font-bold border-t-2 border-emerald-700">
              <td className="sticky right-0 z-10 bg-emerald-100 border border-emerald-200 p-2 text-center" colSpan={3}>
                إجمالي الفريق
              </td>
              {matchTotals.map((t, i) => (
                <td key={i} className="border border-emerald-200 p-2 text-center bg-emerald-50">
                  <div className="font-black text-emerald-900 ltr-numbers">{t.totalMin}</div>
                  <div className="text-[9px] font-normal text-muted-foreground">
                    {t.starting}/11 · {t.bench}/9
                  </div>
                  {t.totalG > 0 && <div className="text-[10px] text-emerald-700">⚽×{t.totalG}</div>}
                </td>
              ))}
              <td className="border border-emerald-200 p-2 text-center bg-emerald-200 ltr-numbers">
                {matchTotals.reduce((s, t) => s + t.totalMin, 0)}
              </td>
              <td className="border border-emerald-200 p-2 text-center bg-emerald-200 ltr-numbers text-emerald-700">
                {matchTotals.reduce((s, t) => s + t.totalG, 0)}
              </td>
              <td className="border border-emerald-200 p-2 text-center bg-emerald-200 ltr-numbers">
                {matches.length}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendChip({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-3 h-3 rounded ${cls} border border-emerald-200`} />
      <span>{label}</span>
    </span>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="border border-emerald-200 p-2 bg-emerald-50 text-right whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-2 whitespace-nowrap ${className}`}>{children}</td>;
}

function posLabel(p: string | null) {
  if (!p) return "—";
  return ({ GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}
function statusLabel(s: string) {
  return ({ active: "نشط", suspended: "موقوف", archived: "مؤرشف" } as any)[s] ?? s;
}
