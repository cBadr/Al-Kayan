"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
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

// Absolute ceiling (also enforced via CHECK constraint on the DB).
// Per-match caps come from `maxStarting`/`maxBench` props on the editor.
const HARD_MAX = 30;
const CUSTOM_KEY = "custom";

// Formation presets: slot positions on a 100×100 pitch.
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
  // Small-sided format (7-a-side for براعم)
  "2-3-1 (7vs7)": [
    { id: "GK",  x: 50, y: 92, role: "GK" },
    { id: "LB",  x: 30, y: 70, role: "DF" },
    { id: "RB",  x: 70, y: 70, role: "DF" },
    { id: "LM",  x: 20, y: 45, role: "MF" },
    { id: "CM",  x: 50, y: 48, role: "MF" },
    { id: "RM",  x: 80, y: 45, role: "MF" },
    { id: "ST",  x: 50, y: 20, role: "FW" },
  ],
  // Empty — user designs from scratch
  [CUSTOM_KEY]: [],
};

const FORMATION_LABELS: Record<string, string> = {
  "4-4-2": "4-4-2 (11)",
  "4-3-3": "4-3-3 (11)",
  "4-2-3-1": "4-2-3-1 (11)",
  "3-5-2": "3-5-2 (11)",
  "2-3-1 (7vs7)": "2-3-1 (7-a-side)",
  [CUSTOM_KEY]: "🎨 تشكيلة مخصصة",
};

type Assigned = Record<string, string>; // slotId -> playerId

export function LineupEditor({
  academyId,
  matchId,
  players,
  participations,
  defaultFormation,
  maxStarting = 11,
  maxBench = 9,
}: {
  academyId: string;
  matchId: string;
  players: Player[];
  participations: ExistingPart[];
  defaultFormation: string | null;
  /** Per-match caps from the matches table. */
  maxStarting?: number;
  maxBench?: number;
}) {
  // Clamp to hard ceiling defensively.
  const capStarting = Math.min(maxStarting, HARD_MAX);
  const capBench = Math.min(maxBench, HARD_MAX);
  // Initial formation: stored value if known, else "4-3-3", else custom if has data without preset.
  const initialFormation = useMemo(() => {
    if (defaultFormation && FORMATIONS[defaultFormation]) return defaultFormation;
    const hasStartingWithCoords = participations.some(
      (p) => p.lineup_role === "starting" && p.pitch_x != null && p.pitch_y != null,
    );
    return hasStartingWithCoords ? CUSTOM_KEY : "4-3-3";
  }, [defaultFormation, participations]);

  const [formation, setFormation] = useState<string>(initialFormation);

  // SLOTS are now state — so they can be dragged + added + removed.
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (initialFormation === CUSTOM_KEY) {
      // Build slots from existing starting participations
      return participations
        .filter((p) => p.lineup_role === "starting" && p.pitch_x != null && p.pitch_y != null)
        .map((p, i) => ({
          id: `custom_${i}_${p.player_id.slice(0, 6)}`,
          x: p.pitch_x!,
          y: p.pitch_y!,
          role: p.pitch_position ?? "MF",
        }));
    }
    // Clone preset so we can mutate (drag) without affecting the FORMATIONS constant
    return FORMATIONS[initialFormation].map((s) => ({ ...s }));
  });

  // Initialize player→slot assignment.
  const [assigned, setAssigned] = useState<Assigned>(() => {
    const a: Assigned = {};
    const starting = participations.filter((p) => p.lineup_role === "starting");

    if (initialFormation === CUSTOM_KEY) {
      // 1:1 by order of starting players to slots (they were generated in the same order)
      const slotIds = participations
        .filter((p) => p.lineup_role === "starting" && p.pitch_x != null && p.pitch_y != null)
        .map((p, i) => `custom_${i}_${p.player_id.slice(0, 6)}`);
      starting.forEach((p, i) => {
        if (slotIds[i]) a[slotIds[i]] = p.player_id;
      });
      return a;
    }

    // Preset mode: match each participation to closest slot
    const presetSlots = FORMATIONS[initialFormation];
    const used = new Set<string>();
    for (const part of starting) {
      if (part.pitch_x == null || part.pitch_y == null) continue;
      let best: Slot | null = null;
      let bestDist = Infinity;
      for (const s of presetSlots) {
        if (used.has(s.id)) continue;
        const d = Math.hypot(s.x - part.pitch_x, s.y - part.pitch_y);
        if (d < bestDist) { bestDist = d; best = s; }
      }
      if (best) { a[best.id] = part.player_id; used.add(best.id); }
    }
    // Fill remaining starters into any free slot
    const remaining = starting.filter((p) => !Object.values(a).includes(p.player_id));
    for (const part of remaining) {
      const free = presetSlots.find((s) => !used.has(s.id));
      if (!free) break;
      a[free.id] = part.player_id;
      used.add(free.id);
    }
    return a;
  });

  const [bench, setBench] = useState<string[]>(() =>
    participations.filter((p) => p.lineup_role === "bench").map((p) => p.player_id),
  );

  const [captain, setCaptain] = useState<string | null>(() =>
    participations.find((p) => p.is_captain)?.player_id ?? null,
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

  // ---------- Formation switching ----------
  function switchFormation(newFormation: string) {
    if (newFormation === formation) return;
    if (Object.keys(assigned).length > 0) {
      if (!confirm("تغيير الخطة سيُعيد توزيع اللاعبين. متابعة؟")) return;
    }
    setFormation(newFormation);
    if (newFormation === CUSTOM_KEY) {
      // Keep existing slots so user can drag from current arrangement
      // (don't clear unless explicit)
    } else {
      // Replace slots with preset clone + remap assigned
      const newSlots = FORMATIONS[newFormation].map((s) => ({ ...s }));
      const oldAssignedPlayerIds = Object.values(assigned);
      const remapped: Assigned = {};
      newSlots.forEach((s, i) => {
        if (oldAssignedPlayerIds[i]) remapped[s.id] = oldAssignedPlayerIds[i];
      });
      setSlots(newSlots);
      setAssigned(remapped);
    }
    setActiveSlot(null);
  }

  // ---------- Slot management ----------
  function addCustomSlot() {
    if (slots.length >= capStarting) {
      setMsg(`الحد الأقصى ${capStarting} مركزاً على الملعب`);
      return;
    }
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    // Add at center by default
    setSlots((s) => [...s, { id, x: 50, y: 50, role: "MF" }]);
    setFormation(CUSTOM_KEY);  // adding a slot makes it custom
    setActiveSlot(id);
  }

  function removeSlot(slotId: string) {
    setSlots((s) => s.filter((x) => x.id !== slotId));
    setAssigned((a) => {
      const next = { ...a };
      delete next[slotId];
      return next;
    });
    setActiveSlot(null);
  }

  function updateSlotRole(slotId: string, role: Position) {
    setSlots((s) => s.map((x) => (x.id === slotId ? { ...x, role } : x)));
  }

  // ---------- Drag handling (pointer events — works on mouse + touch) ----------
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ slotId: string | null; offsetX: number; offsetY: number }>({
    slotId: null, offsetX: 0, offsetY: 0,
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent, slotId: string) => {
    if (!pitchRef.current) return;
    // Only handle primary button / single touch
    if (e.button !== 0 && e.pointerType !== "touch") return;
    e.stopPropagation();
    dragRef.current = { slotId, offsetX: 0, offsetY: 0 };
    setDraggingId(slotId);
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.slotId || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp within pitch with small margin
    const cx = Math.max(2, Math.min(98, x));
    const cy = Math.max(3, Math.min(97, y));
    setSlots((arr) => arr.map((s) => (s.id === drag.slotId ? { ...s, x: cx, y: cy } : s)));
    // Switch to custom mode as soon as user drags
    if (formation !== CUSTOM_KEY) setFormation(CUSTOM_KEY);
  }, [formation]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = { slotId: null, offsetX: 0, offsetY: 0 };
    setDraggingId(null);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {/* noop */}
  }, []);

  // ---------- Player assignment ----------
  function assignToSlot(slotId: string, playerId: string) {
    setAssigned((a) => ({ ...a, [slotId]: playerId }));
    setActiveSlot(null);
    const p = playerMap.get(playerId);
    if (p?.preferred_jersey && !jerseys[playerId]) {
      setJerseys((j) => ({ ...j, [playerId]: p.preferred_jersey ?? null }));
    }
  }

  function clearSlot(slotId: string) {
    setAssigned((a) => { const n = { ...a }; delete n[slotId]; return n; });
  }

  function addToBench(playerId: string) {
    if (bench.length >= capBench) { setMsg(`الاحتياطي ${capBench} لاعب كحد أقصى`); return; }
    setBench((b) => [...b, playerId]);
    setPendingBench(false);
  }

  function removeFromBench(playerId: string) {
    setBench((b) => b.filter((id) => id !== playerId));
  }

  // ---------- Save ----------
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
  const isCustom = formation === CUSTOM_KEY;

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-white border border-border rounded-lg">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">الخطة</label>
          <select
            value={formation}
            onChange={(e) => switchFormation(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            {Object.keys(FORMATIONS).map((f) => (
              <option key={f} value={f}>{FORMATION_LABELS[f] ?? f}</option>
            ))}
          </select>
        </div>
        <div className="text-sm">
          <strong className="text-emerald-700">{startingCount}/{slots.length}</strong> أساسي
          <span className="text-[10px] text-muted-foreground"> (حد {capStarting})</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <strong>{bench.length}/{capBench}</strong> احتياطي
          {isCustom && <span className="ms-2 text-[10px] text-amber-600 font-bold">⚡ وضع مخصص</span>}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCustomSlot}
          disabled={slots.length >= capStarting}
          title="إضافة مركز جديد على الملعب"
        >
          + إضافة مركز
        </Button>
        <div className="ms-auto flex items-center gap-2">
          {msg && <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-700" : "text-red-600"}`}>{msg}</span>}
          <Button onClick={save} disabled={pending} variant="gold">
            {pending ? "جارٍ الحفظ..." : "💾 حفظ التشكيلة"}
          </Button>
        </div>
      </div>

      {/* Drag hint */}
      <div className="text-[11px] text-muted-foreground bg-emerald-50/50 border border-emerald-100 rounded-md p-2 flex items-center gap-2">
        <span className="text-base">💡</span>
        <span>
          <strong className="text-emerald-800">اسحب أي لاعب أو مركز فارغ</strong> لنقله على الملعب — يتحوّل النظام تلقائياً لوضع "تشكيلة مخصصة" بمجرد السحب.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Pitch */}
        <div
          ref={pitchRef}
          className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg touch-none select-none"
          style={{
            background: "linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)",
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <PitchLines />

          {/* Slots */}
          {slots.map((s) => {
            const playerId = assigned[s.id];
            const player = playerId ? playerMap.get(playerId) : null;
            const isActive = activeSlot === s.id;
            const isDragging = draggingId === s.id;
            return (
              <div
                key={s.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${isDragging ? "z-30 scale-110" : "z-10"}`}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  // disable transition while dragging for snappy follow
                  transition: isDragging ? "none" : "left .25s ease, top .25s ease",
                }}
              >
                {player ? (
                  <div
                    onPointerDown={(e) => onPointerDown(e, s.id)}
                    onClick={(e) => { e.stopPropagation(); if (!isDragging) setActiveSlot(isActive ? null : s.id); }}
                    className={`cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
                  >
                    <PlayerToken
                      player={player}
                      jersey={jerseys[player.id] ?? player.preferred_jersey ?? null}
                      isCaptain={captain === player.id}
                      role={s.role}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onPointerDown={(e) => onPointerDown(e, s.id)}
                    onClick={(e) => { e.stopPropagation(); if (!isDragging) setActiveSlot(isActive ? null : s.id); }}
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-dashed transition-all flex items-center justify-center text-[8px] sm:text-[10px] font-bold cursor-grab ${
                      isDragging ? "cursor-grabbing border-amber-400 bg-amber-400/40 text-white scale-110" :
                      isActive
                        ? "border-amber-400 bg-amber-400/30 text-white scale-110"
                        : "border-white/40 text-white/70 hover:border-white hover:bg-white/10"
                    }`}
                    title="اسحب لنقل المركز · انقر لاختيار لاعب"
                  >
                    {posShort(s.role)}
                  </button>
                )}

                {/* Popover for active slot */}
                {isActive && !isDragging && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white text-emerald-950 rounded-lg shadow-xl p-2 z-40 border border-border space-y-1.5"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {player && (
                      <>
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
                      </>
                    )}

                    {/* Role selector (lets user fine-tune position type for custom slots) */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">المركز</span>
                      <select
                        value={s.role}
                        onChange={(e) => updateSlotRole(s.id, e.target.value as Position)}
                        className="h-7 flex-1 rounded border border-border px-1 text-xs"
                      >
                        <option value="GK">حارس</option>
                        <option value="DF">دفاع</option>
                        <option value="MF">وسط</option>
                        <option value="FW">هجوم</option>
                      </select>
                    </div>

                    {player && (
                      <button
                        type="button"
                        onClick={() => setCaptain(captain === player.id ? null : player.id)}
                        className={`w-full text-xs font-semibold rounded px-2 py-1 ${
                          captain === player.id ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {captain === player.id ? "★ القائد" : "تعيين قائد"}
                      </button>
                    )}

                    {player && (
                      <button
                        type="button"
                        onClick={() => { clearSlot(s.id); setActiveSlot(null); }}
                        className="w-full text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded px-2 py-1"
                      >
                        ↺ تفريغ المركز (الإبقاء عليه)
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeSlot(s.id)}
                      className="w-full text-xs font-semibold text-red-600 hover:bg-red-50 rounded px-2 py-1"
                    >
                      🗑 حذف المركز من الملعب
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty pitch hint */}
          {slots.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm pointer-events-none">
              <div className="text-center px-4">
                <div className="text-4xl mb-2">🎨</div>
                <div className="font-bold">ملعب فارغ</div>
                <div className="text-xs opacity-75 mt-1">استخدم "+ إضافة مركز" لبدء التشكيلة</div>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Bench */}
          <div className="bg-white border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm">الاحتياطي ({bench.length}/{capBench})</h4>
              <Button
                size="sm"
                variant={pendingBench ? "default" : "outline"}
                onClick={() => { setPendingBench((v) => !v); setActiveSlot(null); }}
                disabled={bench.length >= capBench}
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
                {pendingBench ? "اختر لاعباً للاحتياطي" : `اختر لاعباً للمركز`}
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
            <div className="bg-white border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-2">
              <p>💡 <strong>اسحب</strong> أي لاعب أو مركز فارغ لنقله على الملعب.</p>
              <p>👆 <strong>انقر</strong> على مركز فارغ لاختيار لاعب، أو على لاعب لتعديله/حذفه.</p>
              <p>+ <strong>إضافة مركز</strong> لإضافة موضع جديد (يعمل لتشكيلات 5/7/11-a-side).</p>
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
      {[...Array(10)].map((_, i) => (
        <rect key={i} x={0} y={i * 15} width={100} height={15} fill={i % 2 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0)"} />
      ))}
      <rect x={2} y={2} width={96} height={146} fill="none" stroke="white" strokeWidth={0.4} opacity={0.7} />
      <line x1={2} y1={75} x2={98} y2={75} stroke="white" strokeWidth={0.3} opacity={0.7} />
      <circle cx={50} cy={75} r={9} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <circle cx={50} cy={75} r={0.6} fill="white" opacity={0.7} />
      <rect x={25} y={2} width={50} height={18} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={37} y={2} width={26} height={7} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={25} y={130} width={50} height={18} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <rect x={37} y={141} width={26} height={7} fill="none" stroke="white" strokeWidth={0.3} opacity={0.7} />
      <circle cx={50} cy={13} r={0.5} fill="white" opacity={0.7} />
      <circle cx={50} cy={137} r={0.5} fill="white" opacity={0.7} />
      <rect x={45} y={0} width={10} height={2} fill="white" opacity={0.5} />
      <rect x={45} y={148} width={10} height={2} fill="white" opacity={0.5} />
    </svg>
  );
}

function PlayerToken({
  player, jersey, isCaptain, role,
}: {
  player: Player; jersey: number | null; isCaptain: boolean; role: Position;
}) {
  const ringColor = role === "GK" ? "ring-amber-400" : role === "DF" ? "ring-sky-400" : role === "MF" ? "ring-emerald-300" : "ring-red-400";
  return (
    <div className="group flex flex-col items-center gap-0.5 pointer-events-none">
      <div className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white shadow-lg ring-2 sm:ring-4 ${ringColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <span className="text-emerald-950 font-black text-lg ltr-numbers">{jersey ?? "?"}</span>
        {isCaptain && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow">C</span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-white max-w-[80px] truncate text-shadow drop-shadow">
        {player.full_name.split(" ")[0]}
      </span>
    </div>
  );
}

function posLabel(p: Position | null) {
  if (!p) return "—";
  return { GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" }[p];
}
function posShort(p: Position) {
  return { GK: "حر", DF: "دف", MF: "وس", FW: "هج" }[p];
}
