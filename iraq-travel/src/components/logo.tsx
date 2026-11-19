/** Wordmark: two wave lines (Tigris & Euphrates) under a stepped ziggurat glyph. */
export function Logo({ light = false, tagline }: { light?: boolean; tagline?: string }) {
  const c = light ? "#fbf8f2" : "#0f2a4a";
  return (
    <span className="inline-flex items-center gap-2.5" dir="ltr">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="40" height="40" rx="10" fill={light ? "rgba(255,255,255,0.08)" : "#0f2a4a"} />
        <path d="M9 24h22v-3H26v-3h-3v-3h-6v3h-3v3H9z" fill="#d9b25f" />
        <path d="M7 29c3-2 6-2 9 0s6 2 9 0 6-2 8 0" stroke="#e5c57e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M7 33c3-2 6-2 9 0s6 2 9 0 6-2 8 0" stroke="#8fb4dc" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-[0.18em]" style={{ color: c, fontFamily: "var(--font-display)" }}>
          IRAQ<span className="text-gold-500"> TRAVEL</span>
        </span>
        {tagline && <span className={`mt-1 text-[10px] tracking-wide ${light ? "text-sand-200" : "text-charcoal-600"}`}>{tagline}</span>}
      </span>
    </span>
  );
}
