"use client";

import { useState, useEffect, useRef } from "react";

const BLUE    = "#3B82F6";
const CYAN    = "#06B6D4";
const AMBER   = "#F59E0B";
const SURF    = "#0C1526";
const SURF2   = "#0F1D36";
const BORD_HI = "rgba(59,130,246,0.38)";

/* ── Stacked Cycling Cards ────────────────────────────────── */

export function AnimatedCardStack() {
  const [active, setActive]   = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = () => {
    setActive((prev) => {
      setExiting(prev);
      setTimeout(() => setExiting(null), 550);
      return (prev + 1) % 3;
    });
  };

  useEffect(() => {
    timerRef.current = setInterval(advance, 2800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCardStyle = (idx: number): React.CSSProperties => {
    const isExiting = idx === exiting;
    const pos = ((idx - active) + 3) % 3; // 0=front, 1=middle, 2=back

    if (isExiting) {
      return {
        position: "absolute", inset: 0,
        transform: "translateY(-115%) rotate(-9deg) scale(0.82)",
        opacity: 0,
        zIndex: 10,
        transition: "transform 0.52s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
        pointerEvents: "none",
      };
    }
    if (pos === 0) return {
      position: "absolute", inset: 0,
      transform: "translateY(0) rotate(0deg) scale(1)",
      opacity: 1, zIndex: 3,
      transition: "transform 0.52s cubic-bezier(0.34,1.56,0.64,1), opacity 0.38s ease",
    };
    if (pos === 1) return {
      position: "absolute", inset: 0,
      transform: "translateY(18px) rotate(2deg) scale(0.94)",
      opacity: 0.65, zIndex: 2,
      transition: "transform 0.52s cubic-bezier(0.34,1.56,0.64,1), opacity 0.38s ease",
    };
    return {
      position: "absolute", inset: 0,
      transform: "translateY(32px) rotate(-2deg) scale(0.88)",
      opacity: 0.35, zIndex: 1,
      transition: "transform 0.52s cubic-bezier(0.34,1.56,0.64,1), opacity 0.38s ease",
    };
  };

  return (
    <div className="select-none">
      {/* Card stack */}
      <div className="relative mx-auto" style={{ width: "100%", maxWidth: 360, height: 230 }}>
        <div style={getCardStyle(0)}><CardAttendance /></div>
        <div style={getCardStyle(1)}><CardPayments /></div>
        <div style={getCardStyle(2)}><CardNotification /></div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-10">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setExiting(active);
              setTimeout(() => setExiting(null), 550);
              setActive(i);
              timerRef.current = setInterval(advance, 2800);
            }}
            aria-label={`Card ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 24 : 8,
              height: 8,
              background: i === active
                ? `linear-gradient(90deg, ${BLUE}, ${CYAN})`
                : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual Mock Cards ────────────────────────────────── */

function CardAttendance() {
  return (
    <div
      className="rounded-2xl p-6 w-full h-full flex flex-col justify-between"
      style={{
        background: SURF2,
        border: `1px solid ${BORD_HI}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.1)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold mb-0.5" style={{ color: "rgba(241,245,249,0.45)" }}>الحضور اليوم</div>
          <div className="text-3xl font-black text-white">94%</div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(59,130,246,0.12)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(241,245,249,0.35)" }}>
          <span>٤٧ من ٥٠ لاعباً</span>
          <span>94%</span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 7, background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "94%", background: `linear-gradient(90deg, ${BLUE}, ${CYAN})`, transition: "width 1s ease" }}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["أحمد م.", "خالد ع.", "سعد ب.", "فهد ر."].map((name, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(16,185,129,0.1)", color: "#6EE7B7" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {name}
          </div>
        ))}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
          ٣ غياب
        </div>
      </div>
    </div>
  );
}

function CardPayments() {
  return (
    <div
      className="rounded-2xl p-6 w-full h-full flex flex-col justify-between"
      style={{
        background: SURF2,
        border: `1px solid rgba(245,158,11,0.3)`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold mb-0.5" style={{ color: "rgba(241,245,249,0.45)" }}>المدفوعات — هذا الشهر</div>
          <div className="text-3xl font-black" style={{ color: AMBER }}>١٢٬٥٠٠ ر.س</div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(245,158,11,0.1)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6EE7B7" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
        +٨.٣٪ مقارنةً بالشهر الماضي
      </div>

      <div className="space-y-2">
        {[
          { name: "أكاديمية الرياض",  amount: "٥٬٢٠٠", pct: 85 },
          { name: "أكاديمية جدة",     amount: "٤٬١٠٠", pct: 68 },
          { name: "أكاديمية الدمام",  amount: "٣٬٢٠٠", pct: 52 },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-xs w-24 truncate" style={{ color: "rgba(241,245,249,0.5)" }}>{row.name}</div>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${row.pct}%`, background: `linear-gradient(90deg, ${AMBER}, #F97316)` }}
              />
            </div>
            <div className="text-xs font-bold ltr-numbers" style={{ color: AMBER, minWidth: 56 }} dir="ltr">{row.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardNotification() {
  return (
    <div
      className="rounded-2xl p-6 w-full h-full flex flex-col justify-between"
      style={{
        background: SURF2,
        border: `1px solid rgba(6,182,212,0.3)`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold mb-0.5" style={{ color: "rgba(241,245,249,0.45)" }}>الإشعارات الحديثة</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-black text-white">١٢</div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(6,182,212,0.15)", color: CYAN }}
            >
              جديد
            </span>
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(6,182,212,0.1)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span
            className="absolute -top-1 -end-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
            style={{ background: CYAN, color: "#030711" }}
          >
            ٣
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { emoji: "⚽", text: "لاعب جديد انضمّ للأكاديمية",  time: "الآن",      color: BLUE },
          { emoji: "💳", text: "تم استلام دفعة شهرية",          time: "٥ د",       color: AMBER },
          { emoji: "✅", text: "تم تسجيل حضور الفريق أ",        time: "١٢ د",      color: "#10B981" },
          { emoji: "⚠️", text: "لاعبان في خطر غياب",          time: "٢٥ د",      color: "#F87171" },
        ].map((n, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ background: i === 0 ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.03)" }}
          >
            <span className="text-sm shrink-0">{n.emoji}</span>
            <span className="text-xs flex-1 leading-tight" style={{ color: "rgba(241,245,249,0.7)" }}>{n.text}</span>
            <span className="text-[10px] shrink-0 ltr-numbers" style={{ color: "rgba(241,245,249,0.3)" }}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
