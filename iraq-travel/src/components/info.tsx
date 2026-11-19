import type { OfficialSource, SafetyAdvisory } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { formatDate } from "@/lib/localize";
import { Notice } from "./badges";

export function InfoRow({ label, value, missing }: { label: string; value: React.ReactNode | null | undefined; missing?: string }) {
  const empty = value == null || value === "";
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-sand-200 py-3 last:border-0">
      <dt className="text-sm font-medium text-charcoal-600">{label}</dt>
      <dd className={`col-span-2 text-sm ${empty ? "italic text-charcoal-600" : "text-charcoal"}`}>{empty ? missing ?? "—" : value}</dd>
    </div>
  );
}

export function SourcesList({ ids, sources, t }: { ids: string[]; sources: Map<string, OfficialSource>; t: Dictionary }) {
  const list = ids.map((id) => sources.get(id)).filter(Boolean) as OfficialSource[];
  if (!list.length) return <p className="text-sm italic text-charcoal-600">{t.common.never}</p>;
  return (
    <ul className="space-y-1 text-sm">
      {list.map((s) => (
        <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-river-700 underline hover:text-gold-700">{s.name}</a></li>
      ))}
    </ul>
  );
}

const LEVEL_TONE: Record<SafetyAdvisory["level"], "info" | "warn" | "danger"> = {
  info: "info", caution: "warn", reconsider_travel: "warn", against_all_but_essential: "danger", against_all_travel: "danger",
};

export function AdvisoryList({ advisories, locale, t, emptyText }: { advisories: SafetyAdvisory[]; locale: Locale; t: Dictionary; emptyText?: string }) {
  if (!advisories.length) return <Notice tone="warn">{emptyText ?? t.common.verifyBefore}</Notice>;
  return (
    <ul className="space-y-3">
      {advisories.map((a) => (
        <li key={a.id}>
          <Notice tone={LEVEL_TONE[a.level]}>
            <p className="text-xs font-semibold uppercase tracking-wide">{t.safety.levels[a.level]} · {a.issuer}</p>
            <p className="mt-1 font-semibold">{a.title}</p>
            <p className="mt-1 whitespace-pre-line">{a.body}</p>
            <p className="mt-2 text-xs opacity-80">
              {t.safety.published}: {formatDate(a.publishedAt, locale)} · {t.safety.updated}: {formatDate(a.updatedAt, locale)}
              {a.sourceUrl && <> · <a className="underline" href={a.sourceUrl} target="_blank" rel="noopener noreferrer">{t.common.officialSource}</a></>}
            </p>
          </Notice>
        </li>
      ))}
    </ul>
  );
}
