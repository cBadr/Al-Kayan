import { getAppSettings } from "@/lib/app-settings";

export function LogoMark({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="logo">
      <defs>
        <linearGradient id="lm-emerald" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="lm-gold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L56 12 V30 C56 46 44 56 32 60 C20 56 8 46 8 30 V12 Z"
        fill="url(#lm-emerald)"
        stroke="url(#lm-gold)"
        strokeWidth="2"
      />
      <g transform="translate(32 32)">
        <circle r="11" fill="#0a1410" stroke="#fcd34d" strokeWidth="1.5" />
        <polygon
          points="0,-7 6.66,-2.16 4.12,5.66 -4.12,5.66 -6.66,-2.16"
          fill="#fcd34d"
        />
        <line x1="0" y1="-7" x2="0" y2="-11" stroke="#fcd34d" strokeWidth="1.2" />
        <line x1="6.66" y1="-2.16" x2="10.4" y2="-3.4" stroke="#fcd34d" strokeWidth="1.2" />
        <line x1="-6.66" y1="-2.16" x2="-10.4" y2="-3.4" stroke="#fcd34d" strokeWidth="1.2" />
        <line x1="4.12" y1="5.66" x2="6.5" y2="8.9" stroke="#fcd34d" strokeWidth="1.2" />
        <line x1="-4.12" y1="5.66" x2="-6.5" y2="8.9" stroke="#fcd34d" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/**
 * Renders the uploaded app logo if available, falls back to the SVG mark.
 * Server component — fetches app_settings on each request.
 */
export async function BrandLogo({ className = "w-12 h-12", rounded = "rounded-2xl" }: { className?: string; rounded?: string }) {
  const s = await getAppSettings();
  if (s.logo_url) {
    return (
      <div className={`${className} ${rounded} overflow-hidden bg-white/5 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.logo_url} alt={s.app_name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return <LogoMark className={className} />;
}
