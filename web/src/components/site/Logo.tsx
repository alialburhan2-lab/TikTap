import Link from "next/link";

export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="10" fill="#172A38" />
      <rect x="7" y="7" width="50" height="50" rx="7" fill="none" stroke="#D8B77A" strokeWidth="1.6" />
      <text x="32" y="43" fontFamily="Cairo, Tahoma, sans-serif" fontSize="28" fontWeight="800" fill="#D8B77A" textAnchor="middle">
        غ
      </text>
    </svg>
  );
}

export function Logo({ name, tagline, light = false }: { name: string; tagline?: string; light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label={`${name} — الصفحة الرئيسية`}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className={`font-display text-xl font-extrabold sm:text-2xl ${light ? "text-white" : "text-navy-900"}`}>{name}</span>
        {tagline && <span className={`text-[11px] font-medium sm:text-xs ${light ? "text-gold-300" : "text-gold-600"}`}>{tagline}</span>}
      </span>
    </Link>
  );
}
