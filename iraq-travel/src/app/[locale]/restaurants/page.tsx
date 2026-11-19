import type { Metadata } from "next";
import { PageHero, RestaurantCard } from "@/components/cards";
import { Notice } from "@/components/badges";
import { FilterBar } from "@/components/filter-bar";
import { RESTAURANT_CATEGORIES } from "@/data/types";
import { getGovernorates, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/restaurants", t.restaurants.title, t.restaurants.intro);
}

export default async function RestaurantsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const { category, gov } = await searchParams;
  const [restaurants, governorates] = await Promise.all([listPublic("restaurants"), getGovernorates()]);
  const govSlug = new Map(governorates.map((g) => [g.id, g.slug]));
  const list = restaurants.filter((r) => (!category || r.categories.includes(category as never)) && (!gov || govSlug.get(r.governorateId) === gov));
  const base = `/${locale}/restaurants`;
  return (
    <>
      <PageHero eyebrow={t.nav.restaurants} title={t.restaurants.title} text={t.restaurants.intro} />
      <section className="container-x mt-10">
        <div className="card bg-gradient-to-br from-sand-100 to-white p-6 md:p-8">
          <p className="eyebrow">{t.restaurants.dishesTitle}</p>
          <p className="font-display mt-2 text-xl text-river-900 md:text-2xl">{t.restaurants.dishes}</p>
          <p className="mt-3 text-sm text-charcoal-600">{t.home.foodText}</p>
        </div>
      </section>
      <div className="container-x mt-8 space-y-4">
        {restaurants.some((r) => r.isDemo) && <Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice>}
        <FilterBar base={base} param="category" current={category} allLabel={t.common.all} keep={{ gov }} options={RESTAURANT_CATEGORIES.map((c) => ({ value: c, label: t.restCats[c] }))} />
        <FilterBar base={base} param="gov" current={gov} allLabel={t.destinations.allGovernorates} keep={{ category }}
          options={governorates.filter((g) => restaurants.some((r) => r.governorateId === g.id)).map((g) => ({ value: g.slug, label: tr(g.name, locale) }))} />
      </div>
      <section className="container-x mt-8">
        {list.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((r) => <RestaurantCard key={r.id} r={r} locale={locale} t={t} />)}</div> : <Notice>{restaurants.length ? t.common.noResults : t.common.notListedYet}</Notice>}
      </section>
    </>
  );
}
