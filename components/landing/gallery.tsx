"use client";

import { useState, useMemo, useEffect } from "react";
import type { GalleryImage } from "@/lib/landing";

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [activeTag, setActiveTag] = useState<string | "all">("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    images.forEach((i) => i.tag && set.add(i.tag));
    return Array.from(set);
  }, [images]);

  const filtered = useMemo(() =>
    activeTag === "all" ? images : images.filter((i) => i.tag === activeTag),
    [images, activeTag],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((i) => (i! < filtered.length - 1 ? i! + 1 : 0));   // RTL: left = next
      if (e.key === "ArrowRight") setLightbox((i) => (i! > 0 ? i! - 1 : filtered.length - 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, filtered.length]);

  if (images.length === 0) {
    return <p className="text-center text-muted-foreground py-12">لا توجد صور بعد.</p>;
  }

  return (
    <>
      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <TagChip
            active={activeTag === "all"}
            onClick={() => setActiveTag("all")}
            label={`الكل (${images.length})`}
          />
          {tags.map((tag) => {
            const count = images.filter((i) => i.tag === tag).length;
            return (
              <TagChip
                key={tag}
                active={activeTag === tag}
                onClick={() => setActiveTag(tag)}
                label={`${tag} (${count})`}
              />
            );
          })}
        </div>
      )}

      {/* Masonry-ish grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-emerald-100 cursor-zoom-in border border-emerald-100 lift-on-hover focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image_url}
              alt={img.title ?? ""}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Caption overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/0 to-emerald-950/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="text-white text-right w-full">
                {img.title && <div className="font-bold text-sm truncate">{img.title}</div>}
                {img.caption && <div className="text-[11px] opacity-80 line-clamp-2">{img.caption}</div>}
              </div>
            </div>
            {/* Tag badge */}
            {img.tag && (
              <span className="absolute top-2 right-2 text-[10px] bg-gold-400 text-emerald-950 px-2 py-0.5 rounded-full font-bold shadow">
                {img.tag}
              </span>
            )}
            {/* Zoom icon corner */}
            <span className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              🔍
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">لا توجد صور بهذا الوسم.</p>
      )}

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="إغلاق"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl flex items-center justify-center"
          >
            ✕
          </button>

          {filtered.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! > 0 ? i! - 1 : filtered.length - 1)); }}
                aria-label="السابقة"
                className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! < filtered.length - 1 ? i! + 1 : 0)); }}
                aria-label="التالية"
                className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center"
              >
                ›
              </button>
            </>
          )}

          <div
            className="max-w-5xl max-h-[90vh] mx-6 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filtered[lightbox].image_url}
              alt={filtered[lightbox].title ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            />
            {(filtered[lightbox].title || filtered[lightbox].caption) && (
              <div className="mt-4 text-center text-white max-w-2xl">
                {filtered[lightbox].title && (
                  <div className="font-bold text-lg">{filtered[lightbox].title}</div>
                )}
                {filtered[lightbox].caption && (
                  <p className="text-sm text-white/80 mt-1">{filtered[lightbox].caption}</p>
                )}
              </div>
            )}
            <div className="text-xs text-white/50 mt-3 ltr-numbers">
              {lightbox + 1} / {filtered.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TagChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
        active
          ? "bg-emerald-700 text-white shadow-md scale-105"
          : "bg-white text-emerald-900 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
      }`}
    >
      {label}
    </button>
  );
}
