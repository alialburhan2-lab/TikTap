import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/cards";
import { DemoBadge, Notice, ProviderBadge, StatusBadge } from "@/components/badges";
import { ReportForm } from "@/components/report-form";
import { PROVIDER_LEVELS, REPORT_TYPES } from "@/data/types";
import { getGovernorates, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/protection", t.protection.title, t.protection.intro);
}

export default async function ProtectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [hotels, restaurants, guides, providers, governorates] = await Promise.all([
    listPublic("hotels"), listPublic("restaurants"), listPublic("tourGuides"), listPublic("transportProviders"), getGovernorates(),
  ]);
  const groups = [
    { title: t.nav.hotels, items: hotels.map((h) => ({ id: h.id, name: h.name, level: h.providerLevel, status: h.verificationStatus, demo: h.isDemo, href: `/${locale}/hotels/${h.slug}` })) },
    { title: t.protection.guides, items: guides.filter((g) => g.kind === "guide").map((g) => ({ id: g.id, name: g.name, level: g.providerLevel, status: g.verificationStatus, demo: g.isDemo, href: null })) },
    { title: t.protection.drivers, items: [...guides.filter((g) => g.kind === "driver"), ...providers].map((g) => ({ id: g.id, name: g.name, level: g.providerLevel, status: g.verificationStatus, demo: g.isDemo, href: null })) },
    { title: t.protection.agencies, items: guides.filter((g) => g.kind === "agency").map((g) => ({ id: g.id, name: g.name, level: g.providerLevel, status: g.verificationStatus, demo: g.isDemo, href: null })) },
    { title: t.nav.restaurants, items: restaurants.map((r) => ({ id: r.id, name: r.name, level: r.providerLevel, status: r.verificationStatus, demo: r.isDemo, href: `/${locale}/restaurants/${r.slug}` })) },
  ];

  return (
    <>
      <PageHero eyebrow={t.nav.protection} title={t.protection.title} text={t.protection.intro} />
      <section className="container-x mt-10">
        <SectionHeading title={t.protection.levelsTitle} />
        <ol className="grid gap-4 md:grid-cols-4">
          {PROVIDER_LEVELS.map((l, i) => (
            <li key={l} className="card p-5">
              <p className="font-display text-3xl font-bold text-gold-500">{i}</p>
              <div className="mt-2"><ProviderBadge level={l} t={t} /></div>
              <p className="mt-2 text-sm text-charcoal-600">{t.protection.levelsText[l]}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4"><Notice>{t.protection.verifiedOnlyNote}</Notice></div>
      </section>

      <section className="container-x mt-14">
        <SectionHeading title={t.protection.directory} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="card p-5">
              <h3 className="font-display mb-3 text-lg font-bold text-river-900">{g.title}</h3>
              {g.items.length === 0 ? <p className="text-sm italic text-charcoal-600">{t.common.notListedYet}</p> : (
                <ul className="space-y-2">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5">{it.demo && <DemoBadge t={t} />}{it.href ? <Link href={it.href} className="hover:underline">{it.name}</Link> : it.name}</span>
                      <span className="flex gap-1"><ProviderBadge level={it.level} t={t} /><StatusBadge status={it.status} t={t} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-14 grid gap-8 lg:grid-cols-[1fr_380px]" id="report">
        <div>
          <SectionHeading title={t.protection.reportTitle} />
          <ReportForm t={t.protection} governorates={governorates.map((g) => ({ id: g.id, name: tr(g.name, locale) }))} types={REPORT_TYPES} />
        </div>
        <aside className="card h-fit p-6">
          <h3 className="font-display text-lg font-bold text-river-900">{t.protection.scamTips}</h3>
          <p className="mt-2 text-sm text-charcoal-600">{t.protection.scamTipsText}</p>
        </aside>
      </section>
    </>
  );
}
