import type { Metadata } from "next";
import { HotelCard, PageHero } from "@/components/cards";
import { Notice } from "@/components/badges";
import { FilterBar } from "@/components/filter-bar";
import { HOTEL_CATEGORIES } from "@/data/types";
import { getGovernorates, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";
import { showDemoData } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/hotels", t.hotels.title, t.hotels.intro);
}

type S = Promise<Record<string, string | undefined>>;

export default async function HotelsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: S }) {
  const { locale, t } = await resolveLocale(params);
  const { category, gov } = await searchParams;
  const [hotels, governorates] = await Promise.all([listPublic("hotels"), getGovernorates()]);
  const govSlug = new Map(governorates.map((g) => [g.id, g.slug]));
  const list = hotels.filter((h) => (!category || h.category === category) && (!gov || govSlug.get(h.governorateId) === gov));
  const base = `/${locale}/hotels`;

  return (
    <>
      <PageHero eyebrow={t.nav.hotels} title={t.hotels.title} text={t.hotels.intro} />
      <div className="container-x mt-10 space-y-4">
        {showDemoData() && hotels.some((h) => h.isDemo) && <Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice>}
        <Notice>{t.common.bookingNotAvailable}</Notice>
        <FilterBar base={base} param="category" current={category} allLabel={t.common.all} keep={{ gov }} options={HOTEL_CATEGORIES.map((c) => ({ value: c, label: t.hotelCats[c] }))} />
        <FilterBar base={base} param="gov" current={gov} allLabel={t.destinations.allGovernorates} keep={{ category }}
          options={governorates.filter((g) => hotels.some((h) => h.governorateId === g.id)).map((g) => ({ value: g.slug, label: tr(g.name, locale) }))} />
      </div>
      <section className="container-x mt-8">
        {list.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((h) => <HotelCard key={h.id} hotel={h} locale={locale} t={t} />)}</div> : <Notice>{hotels.length ? t.common.noResults : t.common.notListedYet}</Notice>}
      </section>
    </>
  );
}
