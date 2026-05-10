"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/lib/landing";

interface Props {
  slides: HeroSlide[];
  overlayOpacity: number;
  fallbackTagline: string | null;
}

const AUTOPLAY_MS = 6000;

export function HeroSlideshow({ slides, overlayOpacity, fallbackTagline }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  // No slides — graceful fallback
  if (slides.length === 0) {
    return <FallbackHero tagline={fallbackTagline} overlayOpacity={overlayOpacity} />;
  }

  const next = () => setActive((i) => (i + 1) % slides.length);
  const prev = () => setActive((i) => (i - 1 + slides.length) % slides.length);

  // Touch swipe (RTL: swipe left = next, swipe right = prev)
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
    startX.current = null;
  };

  return (
    <section
      className="relative min-h-[88vh] sm:min-h-[92vh] overflow-hidden bg-emerald-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides stacked, fade in/out */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          aria-hidden={i !== active}
        >
          {/* Background image */}
          {s.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.image_url}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ${i === active ? "scale-110" : "scale-100"}`}
            />
          ) : (
            <div className="absolute inset-0 bg-mesh-emerald" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: `rgba(6, 78, 59, ${overlayOpacity})` }} />
          <div className="absolute inset-0 noise-overlay opacity-40" />

          {/* Decorative SVG (pitch lines) */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
            <circle cx="600" cy="400" r="120" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="600" cy="400" r="4" fill="white" />
            <line x1="600" y1="0" x2="600" y2="800" stroke="white" strokeWidth="2" />
          </svg>

          {/* Floating decorative blobs */}
          <div className="absolute -top-32 -right-40 w-[28rem] h-[28rem] rounded-full bg-gold-400/10 blur-3xl animate-drift" />
          <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-emerald-500/15 blur-3xl animate-drift" style={{ animationDelay: "2s" }} />

          {/* Text content */}
          <div className={`relative z-20 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center min-h-[88vh] sm:min-h-[92vh] ${
            s.text_position === "center" ? "justify-center text-center" :
            s.text_position === "left" ? "justify-end" : "justify-start"
          }`}>
            <div
              className={`max-w-2xl ${i === active ? "animate-fade-up" : ""}`}
              style={{ animationDelay: i === active ? "200ms" : "0" }}
              key={`content-${active}-${s.id}`}  // re-trigger animation on slide change
            >
              {s.subtitle && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs sm:text-sm font-semibold text-gold-300 mb-4 sm:mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                  {s.subtitle}
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05] text-white drop-shadow-2xl">
                {s.title}
              </h1>
              {s.description && (
                <p className="text-base sm:text-lg text-white/85 mt-4 sm:mt-6 leading-loose drop-shadow-md">
                  {s.description}
                </p>
              )}
              {s.cta_label && s.cta_link && (
                <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 justify-start">
                  <CtaButton href={s.cta_link} label={s.cta_label} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Top decorative chip — always visible */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
        {fallbackTagline ?? "منصة سلامة"}
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="الشريحة السابقة"
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white text-lg flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="الشريحة التالية"
            className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white text-lg flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اذهب للشريحة ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-10 bg-gold-400" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Wave separator */}
      <svg className="absolute bottom-0 left-0 right-0 w-full h-12 text-white z-20" preserveAspectRatio="none" viewBox="0 0 1200 60">
        <path fill="currentColor" d="M0,60 L0,30 Q300,0 600,30 T1200,30 L1200,60 Z" />
      </svg>
    </section>
  );
}

function CtaButton({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("http");
  const cls = "inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gold-400 hover:bg-gold-500 text-emerald-950 font-bold text-sm sm:text-base shadow-2xl shadow-gold-400/30 animate-glow-pulse transition-colors";
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>;
  }
  return <Link href={href} className={cls}>{label}</Link>;
}

function FallbackHero({ tagline, overlayOpacity }: { tagline: string | null; overlayOpacity: number }) {
  return (
    <section className="relative min-h-[88vh] bg-mesh-emerald text-white flex items-center">
      <div className="absolute inset-0" style={{ background: `rgba(6, 78, 59, ${overlayOpacity})` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black">{tagline ?? "منصة سلامة"}</h1>
      </div>
    </section>
  );
}
