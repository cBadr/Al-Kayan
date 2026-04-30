"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setLineup } from "../actions";

type Position = "GK" | "DF" | "MF" | "FW";
type Slot = { id: string; x: number; y: number; role: Position };

interface Player {
  id: string;
  full_name: string;
  code: string;
  position: Position | null;
  preferred_jersey: number | null;
  photo_url?: string | null;
}

interface ExistingPart {
  player_id: string;
  lineup_role: "starting" | "bench" | "unused";
  pitch_position: Position | null;
  pitch_x: number | null;
  pitch_y: number | null;
  jersey_number: number | null;
  is_captain: boolean;
}

// Formation templates: slot positions on a 100×100 pitch
const FORMATIONS: Record<string, Slot[]> = {
  "4-4-2": [
    { id: "GK",  x: 50, y: 92, role: "GK" },
    { id: "LB",  x: 15, y: 72, role: "DF" },
    { id: "CB1", x: 36, y: 75, role: "DF" },
    { id: "CB2", x: 64, y: 75, role: "DF" },
    { id: "RB",  x: 85, y: 72, role: "DF" },
    { id: "LM",  x: 15, y: 48, role: "MF" },
    { id: "CM1", x: 38, y: 52, role: "MF" },
    { id: "CM2", x: 62, y: 52, role: "MF" },
    { id: "RM",  x: 85, y: 48, role: "MF" },
    { id: "ST1", x: 35, y: 22, role: "FW" },
    { id: "ST2", x: 65, y: 22, role: "FW" },
  ],
  "4-3-3": [
    { id: "GK",  x: 50, y: 92, role: "GK" },
    { id: "LB",  x: 15, y: 72, role: "DF" },
    { id: "CB1", x: 36, y: 75, role: "DF" },
    { id: "CB2", x: 64, y: 75, role: "DF" },
    { id: "RB",  x: 85, y: 72, role: "DF" },
    { id: "LCM", x: 28, y: 52, role: "MF" },
    { id: "CM",  x: 50, y: 55, role: "MF" },
    { id: "RCM", x: 72, y: 52, role: "MF" },
    { id: "LW",  x: 18, y: 22, role: "FW" },
    { id: "CF",  x: 50, y: 18, role: "FW" },
    { id: "RW",  x: 82, y: 22, role: "FW" },
  ],
  "4-2-3-1": [
    { id: "GK",  x: 50, y: 92, role: "GK" },
    { id: "LB",  x: 15, y: 72, role: "DF" },
    { id: "CB1", x: 36, y: 75, role: "DF" },
    { id: "CB2", x: 64, y: 75, role: "DF" },
    { id: "RB",  x: 85, y: 72, role: "DF" },
    { id: "DM1", x: 38, y: 58, role: "MF" },
    { id: "DM2", x: 62, y: 58, role: "MF" },
    { id: "LAM", x: 22, y: 36, role: "MF" },
    { id: "CAM", x: 50, y: 38, role: "MF" },
    { id: "RAM", x: 78, y: 36, role: "MF" },
    { id: "CF",  x: 50, y: 16, role: "FW" },
  ],
  "3-5-2": [
    { id: "GK",  x: 50, y: 92, role: "GK" },
    { id: "CB1", x: 28, y: 75, role: "DF" },
    { id: "CB2", x: 50, y: 78, role: "DF" },
    { id: "CB3", x: 72, y: 75, role: "DF" },
    { id: "LWB", x: 12, y: 55, role: "MF" },
    { id: "LCM", x: 32, y: 50, role: "MF" },
    { id: "CM",  x: 50, y: 52, role: "MF" },
    { id: "RCM", x: 68, y: 50, role: "MF" },
    { id: "RWB", x: 88, y: 55, role: "MF" },
    { id: "ST1", x: 36, y: 22, role: "FW" },
    { id: "ST2", x: 64, y: 22, role: "FW" },
  ],
};

type Assigned = Record<string, string>; // slotId -> playerId

export function LineupEditor({
  academyId,
  matchId,
  players,
  participations,
  defaultFormation,
}: {
  academyId: string;
  matchId: string;
  players: Player[];
  participations: ExistingPart[];
  defaultFormation: string | null;
}) {
  const [formation, setFormation] = useState<string>(defaultFormation && FORMATIONS[defaultFormation] ? defaultFormation : "4-3-3");
  const slots = FORMATIONS[formation];

  // Initialize from existing participations
  const [assigned, setAssigned] = useState<Assigned>(() => {
    const a: Assigned = {};
    const starting = participations.filter((p) => p.lineup_role === "starting");
    // Match by closest (x,y) to formation slots
    const usedSlots = new Set<string>();
    for (const part of starting) {
      if (part.pitch_x == null || part.pitch_y == null) continue;
      let best: Slot | null = null;
      let bestDist = Infinity;
      for (const s of slots) {
        if (usedSlots.has(s.id)) continue;
        const d = Math.hypot(s.x - part.pitch_x, s.y - part.pitch_y);
        if (d < bestDist) { bestDist = d; best = s; }
      }
      if (best) {
        a[best.id] = part.player_id;
        usedSlots.add(best.id);
      }
    }
    // Any starting players without coords go to first free slot
    const remaining = starting.filter((p) => !Object.values(a).includes(p.player_id));
    for (const part of remaining) {
      const free = slots.find((s) => !usedSlots.has(s.id));
      if (!free) break;
      a[free.id] = part.player_id;
      usedSlots.add(free.id);
    }
    return a;
  });

  const [bench, setBench] = useState<string[]>(() =>
    participations.filter((p) => p.lineup_role === "bench").map((p) => p.player_id)
  );

  const [captain, setCaptain] = useState<string | null>(() =>
    participations.find((p) => p.is_captain)?.player_id ?? null
  );

  const [jerseys, setJerseys] = useState<Record<string, number | null>>(() => {
    const j: Record<string, number | null> = {};
    for (const part of participations) j[part.player_id] = part.jersey_number;
    return j;
  });

  const [search, setSearch] = useState("");
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [pendingBench, setPendingBench] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const usedIds = useMemo(() => new Set([...Object.values(assigned), ...bench]), [assigned, bench]);

  const availablePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (usedIds.has(p.id)) return false;
      if (!q) return true;
      return p.full_name.toLowerCase().includes(q) || p.code.includes(q) || (p.position ?? "").toLowerCase().includes(q);
    });
  }, [players, usedIds, search]);

  function assignToSlot(slotId: string, playerId: string) {
    setAssigned((a) => ({ ...a, [slotId]: playerId }));
    setActiveSlot(null);
    // Auto-fill jersey from preferred if not set
    const p = playerMap.get(playerId);
    if (p?.preferred_jersey && !jerseys[playerId]) {
      setJerseys((j) => ({ ...j, [playerId]: p.preferred_jersey ?? null }));
    }
  }

  function removeFromSlot(slotId: string) {
    setAssigned((a) => {
      const next = { ...a };
      delete next[slotId];
      return next;
    });
  }

  function addToBench(playerId: string) {
    if (bench.length >= 9) { setMsg("الاحتياطي 9 لاعبين فقط"); return; }
    setBench((b) => [...b, playerId]);
    setPendingBench(false);
  }

  function removeFromBench(playerId: string) {
    setBench((b) => b.filter((id) => id !== playerId));
  }

  function save() {
    setMsg(null);
    const startingArr = slots
      .filter((s) => assigned[s.id])
      .map((s) => ({
        player_id: assigned[s.id],
        pitch_position: s.role,
        pitch_x: s.x,
        pitch_y: s.y,
        jersey_number: jerseys[assigned[s.id]] ?? null,
        is_captain: captain === assigned[s.id],
      }));
    const benchArr = bench.map((pid) => ({
      player_id: pid,
      jersey_number: jerseys[pid] ?? null,
    }));
    startTransition(async () => {
      const res = await setLineup(academyId, matchId, startingArr, benchArr);
      if (res && "error" in res && res.error) setMsg(res.error);
      else setMsg("✅ تم حفظ التشكيلة");
    });
  }

  const startingCount = Object.keys(assigned).length;

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-white border border-border rounded-lg">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">الخطة</label>
          <select
            value={formation}
            onChange={(e) => {
              if (Object.keys(assigned).length > 0 && !confirm("تغيير الخطة قد يعيد توزيع اللاعبين على المراكز. متابعة؟")) return;
              setFormation(e.target.value);
            }}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            {Object.keys(FORMATIONS).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="text-sm">
          <strong className="text-emerald-700">{startingCount}/11</strong> أساسي · <strong>{bench.length}/9</strong> احتياطي
        </div>
        <div className="ms-auto flex items-center gap-2">
          {msg && <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-700" : "text-red-600"}`}>{msg}</span>}
          <Button onClick={save} disabled={pending} variant="gold">
            {pending ? "جارٍ الحفظ..." : "💾 حفظ التشكيلة"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Pitch */}
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg" style={{
          background: "linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)",
        }}>
          {/* Pitch lines */}
          <PitchLines />

          {/* Slots */}
          {slots.map((s) => {
            const playerId = assigned[s.id];
            const player = playerId ? playerMap.get(playerId) : null;
            const isActive = activeSlot === s.id;
            return (
              <div
                key={s.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                {player ? (
                  <PlayerToken
                    player={player}
                    jersey={jerseys[player.id] ?? player.preferred_jersey ?? null}
                    isCaptain={captain === player.id}
                    role={s.role}
                    onClick={() => setActiveSlot(isActive ? null : s.id)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSlot(isActive ? null : s.id)}
                    className={`w-14 h-14 rounded-full border-2 border-dashed transition-all flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "border-amber-400 bg-amber-400/30 text-white scale-110"
                        : "border-white/40 text-white/70 hover:border-white hover:bg-white/10"
                    }`}
                    title={s.id}
                  >
                    {s.id}
                  </button>
                )}
                {isActive && player && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white text-emerald-950 rounded-lg shadow-xl p-2 z-20 border border-border space-y-1">
                    <p className="text-xs font-semibold truncate">{player.full_name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">رقم</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={jerseys[player.id] ?? ""}
                        onChange={(e) => setJerseys((j) => ({ ...j, [player.id]: e.target.value ? Number(e.target.value) : null }))}
                        className="h-7 w-14 rounded border border-border px-2 text-center text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaptain(captain === player.id ? null : player.id)}
                      className={`w-full text-xs font-semibold rounded px-2 py-1 ${
                        captain === player.id ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {captain === player.id ? "★ القائد" : "تعيين قائد"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { removeFromSlot(s.id); setActiveSlot(null); }}
                      className="w-full text-xs font-semibold text-red-600 hover:bg-red-50 rounded px-2 py-1"
                    >
                      🗑 إزالة من التشكيلة
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Side panel: Player picker / Bench */}
        <div className="space-y-3">
          {/* Bench */}
          <div className="bg-white border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm">الاحتياطي ({bench.length}/9)</h4>
              <Button
                size="sm"
                variant={pendingBench ? "default" : "outline"}
                onClick={() => { setPendingBench((v) => !v); setActiveSlot(null); }}
                disabled={bench.length >= 9}
              >
                {pendingBench ? "اختر لاعباً ↓" : "+ إضافة"}
              </Button>
            </div>
            {bench.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا يوجد لاعبون احتياطيون</p>
            ) : (
              <ul className="space-y-1">
                {bench.map((pid) => {
                  const p = playerMap.get(pid);
                  if (!p) return null;
                  return (
                    <li key={pid} className="flex items-center justify-between gap-2 text-xs bg-muted/40 rounded p-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                          {jerseys[pid] ?? "?"}
                        </span>
                        <span className="font-medium truncate">{p.full_name}</span>
                        <span className="text-[10px] text-muted-foreground">{posLabel(p.position)}</span>
                      </div>
                      <button onClick={() => removeFromBench(pid)} className="text-red-600 text-xs hover:underline">×</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Player picker */}
          {(activeSlot && !assigned[activeSlot]) || pendingBench ? (
            <div className="bg-white border-2 border-emerald-400 rounded-lg p-3 sticky top-2">
              <h4 className="font-bold text-sm mb-2">
                {pendingBench ? "اختر لاعباً للاحتياطي" : `اختر لاعباً للمركز: ${activeSlot}`}
              </h4>
              <Input
                placeholder="ابحث بالاسم/الكود/المركز..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-96 overflow-y-auto space-y-1">
                {availablePlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (pendingBench) addToBench(p.id);
                      else if (activeSlot) assignToSlot(activeSlot, p.id);
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-emerald-50 rounded text-right"
                  >
                    <span className="text-xs font-mono w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      {p.preferred_jersey ?? "—"}
                    </span>
                    <span className="flex-1 min-w-0 text-sm truncate">{p.full_name}</span>
                    <span className="text-[10px] text-muted-foreground">{posLabel(p.position)}</span>
                  </button>
                ))}
                {availablePlayers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">لا يوجد لاعبون متاحون</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-lg p-3 text-center text-sm text-muted-foreground">
              اضغط على مركز فارغ في الملعب لاختيار لاعب، أو اضغط "+ إضافة" للاحتياطي.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Stripes */}
      {[...Array(10)].map((_, i) => (
        <rect key={i} x={0} y={i * 15} width={100} height={15} fill={i % 2 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0)"} />
      ))}
      {/* Border */}
      <rect x={2} y={2} width={96} height={146} fill="none" stroke="white" strokeWidth={0.4} opacity={0.7} />
      {/* Halfway line */}
      <line x1={2} y1={75} x2={98} y2={75} stroke="white" strokeWidth={0.3} opacity={0.7} />
      {/* Center circle */}
      <circle cx={50} cy={75} r={9} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <circle cx={50} cy={75} r={0.6} fill="white" opacity={0.7} />
      {/* Penalty boxes */}
      <rect x={25} y={2} width={50} height={18} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={37} y={2} width={26} height={7} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={25} y={130} width={50} height={18} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={37} y={141} width={26} height={7} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      {/* Penalty spots */}
      <circle cx={50} cy={13} r={0.5} fill="white" opacity={0.7} />
      <circle cx={50} cy={137} r={0.5} fill="white" opacity={0.7} />
      {/* Goals */}
      <rect x={45} y={0} width={10} height={2} fill="white" opacity={0.5} />
      <rect x={45} y={148} width={10} height={2} fill="white" opacity={0.5} />
    </svg>
  );
}

function PlayerToken({
  player, jersey, isCaptain, role, onClick,
}: {
  player: Player; jersey: number | null; isCaptain: boolean; role: Position; onClick: () => void;
}) {
  const ringColor = role === "GK" ? "ring-amber-400" : role === "DF" ? "ring-sky-400" : role === "MF" ? "ring-emerald-300" : "ring-red-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-0.5 cursor-pointer"
    >
      <div className={`relative w-14 h-14 rounded-full bg-white shadow-lg ring-4 ${ringColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <span className="text-emerald-950 font-black text-lg ltr-numbers">{jersey ?? "?"}</span>
        {isCaptain && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow">C</span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-white max-w-[80px] truncate text-shadow drop-shadow">
        {player.full_name.split(" ")[0]}
      </span>
    </button>
  );
}

function posLabel(p: Position | null) {
  if (!p) return "—";
  return { GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" }[p];
}
