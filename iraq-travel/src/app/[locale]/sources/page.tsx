import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/cards";
import { StatusBadge } from "@/components/badges";
import { VERIFICATION_STATUSES } from "@/data/types";
import { listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/localize";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/sources", t.sources.title, t.sources.intro);
}

export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const sources = await listPublic("officialSources");
  return (
    <>
      <PageHero eyebrow={t.nav.sources} title={t.sources.title} text={t.sources.intro} />
      <section className="container-x mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading title={t.sources.statuses} />
          <ul className="card divide-y divide-sand-200">
            {VERIFICATION_STATUSES.map((s) => (
              <li key={s} className="flex items-start gap-3 p-4"><StatusBadge status={s} t={t} /><span className="text-sm text-charcoal-600">{t.sources.statusText[s]}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading title={t.sources.rules} />
          <div className="card p-6 text-charcoal-600">{t.sources.rulesText}</div>
        </div>
      </section>
      <section className="container-x mt-14">
        <SectionHeading title={t.sources.list} />
        <ul className="grid gap-4 md:grid-cols-2">
          {sources.map((s) => (
            <li key={s.id} className="card p-5">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-river-900 hover:underline">{s.name} ↗</a>
              <p className="text-xs text-charcoal-600">{s.url}</p>
              {s.notes && <p className="mt-2 text-sm text-charcoal-600">{s.notes}</p>}
              <p className="mt-2 text-xs text-charcoal-600">{t.common.lastVerified}: {formatDate(s.lastChecked, locale) ?? t.common.never}{!s.termsReviewed && " · terms of use pending review"}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
