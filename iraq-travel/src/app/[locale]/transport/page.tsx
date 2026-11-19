import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/cards";
import { DemoBadge, Notice, ProviderBadge, StatusBadge } from "@/components/badges";
import { FilterBar } from "@/components/filter-bar";
import { TRANSPORT_MODES } from "@/data/types";
import { getGovernorates, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";
import { formatIqd } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/transport", t.transport.title, t.transport.intro);
}

export default async function TransportPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const { mode } = await searchParams;
  const [routes, providers, governorates] = await Promise.all([listPublic("transportRoutes"), listPublic("transportProviders"), getGovernorates()]);
  const gov = new Map(governorates.map((g) => [g.id, g]));
  const prov = new Map(providers.map((p) => [p.id, p]));
  const list = routes.filter((r) => !mode || r.mode === mode);
  const dur = (m: number | null) => (m == null ? null : `${Math.floor(m / 60)}${t.common.hours} ${m % 60 ? `${m % 60}m` : ""}`.trim());

  return (
    <>
      <PageHero eyebrow={t.nav.transport} title={t.transport.title} text={t.transport.intro} />
      <section className="container-x mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRANSPORT_MODES.map((m) => {
          const n = routes.filter((r) => r.mode === m).length;
          return (
            <a key={m} href={`/${locale}/transport?mode=${m}#compare`} className="card card-hover p-5">
              <p className="font-display text-xl font-bold text-river-900">{t.modes[m]}</p>
              <p className="mt-1 text-sm text-charcoal-600">{n ? `${n} ${t.common.results}` : t.common.notListedYet}</p>
            </a>
          );
        })}
      </section>

      <section id="compare" className="container-x mt-14 scroll-mt-24">
        <SectionHeading title={t.transport.compare} />
        <div className="mb-4 space-y-3">
          <FilterBar base={`/${locale}/transport`} param="mode" current={mode} allLabel={t.common.all} options={TRANSPORT_MODES.map((m) => ({ value: m, label: t.modes[m] }))} />
          {routes.some((r) => r.isDemo) && <Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice>}
        </div>
        {list.length === 0 ? <Notice>{t.common.notListedYet}</Notice> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-sand-100 text-xs uppercase tracking-wide text-charcoal-600">
                <tr>{[t.common.from, t.common.to, t.common.category, t.common.provider, t.common.min + " / " + t.common.max, t.common.duration, t.common.departure, t.common.arrival, t.common.luggage, t.common.bookingMethod, t.common.status].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {list.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 font-medium">{tr(gov.get(r.fromGovernorateId)?.name, locale)}</td>
                    <td className="px-4 py-3 font-medium">{tr(gov.get(r.toGovernorateId)?.name, locale)}</td>
                    <td className="px-4 py-3">{t.modes[r.mode]} {r.isDemo && <DemoBadge t={t} />}</td>
                    <td className="px-4 py-3">{r.providerId && prov.get(r.providerId) ? prov.get(r.providerId)!.name : "—"}</td>
                    <td className="px-4 py-3">{r.priceMinIqd != null && r.priceMaxIqd != null ? `${formatIqd(r.priceMinIqd, locale)} – ${formatIqd(r.priceMaxIqd, locale)}` : <em className="text-charcoal-600">{t.common.priceNotVerified}</em>}</td>
                    <td className="px-4 py-3">{dur(r.durationMinutes) ?? <em className="text-charcoal-600">{t.common.unknown}</em>}</td>
                    <td className="px-4 py-3">{r.departure ?? <em className="text-charcoal-600">{t.transport.noSchedule}</em>}</td>
                    <td className="px-4 py-3">{r.arrival ?? "—"}</td>
                    <td className="px-4 py-3">{r.luggage ?? "—"}</td>
                    <td className="px-4 py-3">{r.bookingMethod ?? "—"}{r.notes && <span className="mt-1 block text-xs text-charcoal-600">{r.notes}</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.verificationStatus} lastVerified={r.lastVerified} t={t} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="container-x mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading title={t.transport.providers} />
          <ul className="space-y-3">
            {providers.map((p) => (
              <li key={p.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-river-900">{p.name}</p>
                  <span className="flex gap-1.5"><ProviderBadge level={p.providerLevel} t={t} /><StatusBadge status={p.verificationStatus} lastVerified={p.lastVerified} t={t} /></span>
                </div>
                <p className="mt-1 text-sm text-charcoal-600">{p.modes.map((m) => t.modes[m]).join(" · ")}</p>
                {p.notes && <p className="mt-2 text-sm text-charcoal-600">{p.notes}</p>}
                {p.website && <a href={p.website} className="mt-2 inline-block text-sm text-river-700 underline" target="_blank" rel="noopener noreferrer">{p.website.replace(/^https?:\/\//, "")}</a>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading title={t.transport.tips} />
          <div className="card p-6 text-charcoal-600">{t.transport.tipsText}</div>
        </div>
      </section>
    </>
  );
}
