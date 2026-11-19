import type { ProviderVerificationLevel, VerificationStatus } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionary";
import { isStale } from "@/lib/localize";

const STATUS_STYLE: Record<VerificationStatus | "not_available", string> = {
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  partially_verified: "bg-sky-50 text-sky-800 ring-sky-600/20",
  estimated: "bg-amber-50 text-amber-800 ring-amber-600/20",
  unverified: "bg-stone-100 text-stone-700 ring-stone-500/20",
  outdated: "bg-rose-50 text-rose-800 ring-rose-600/20",
  not_available: "bg-stone-100 text-stone-600 ring-stone-500/20",
};

const ICON: Record<VerificationStatus | "not_available", string> = {
  verified: "✓", partially_verified: "◐", estimated: "≈", unverified: "?", outdated: "!", not_available: "–",
};

/** Data-quality badge. A "verified" record whose date is stale is shown as outdated. */
export function StatusBadge({ status, t, lastVerified, className = "" }: { status: VerificationStatus | "not_available"; t: Dictionary; lastVerified?: string | null; className?: string }) {
  const effective = status === "verified" && lastVerified !== undefined && isStale(lastVerified) ? "outdated" : status;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLE[effective]} ${className}`} title={t.status[effective]}>
      <span aria-hidden>{ICON[effective]}</span>
      {t.status[effective]}
    </span>
  );
}

const LEVEL_STYLE: Record<ProviderVerificationLevel, string> = {
  unverified: "bg-stone-100 text-stone-700 ring-stone-500/20",
  contact_verified: "bg-sky-50 text-sky-800 ring-sky-600/20",
  documents_checked: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  license_verified: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
};

export function ProviderBadge({ level, t }: { level: ProviderVerificationLevel; t: Dictionary }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${LEVEL_STYLE[level]}`}>
      <span aria-hidden>{level === "unverified" ? "○" : "◆"}</span>
      {t.provider[level]}
    </span>
  );
}

export function DemoBadge({ t }: { t: Dictionary }) {
  return (
    <span className="inline-flex items-center rounded-md bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white" title={t.common.demoNotice}>
      {t.common.demo}
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "danger" | "demo" }) {
  const styles = {
    info: "bg-river-100/60 text-river-900 ring-river-500/20",
    warn: "bg-amber-50 text-amber-900 ring-amber-500/30",
    danger: "bg-rose-50 text-rose-900 ring-rose-500/30",
    demo: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-500/30",
  }[tone];
  return <div role={tone === "danger" ? "alert" : "note"} className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${styles}`}>{children}</div>;
}
