import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero } from "@/components/cards";
import { Notice, StatusBadge } from "@/components/badges";
import { PlaceImage } from "@/components/place-image";
import { STORIES } from "@/data/stories";
import { getSites } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { isTranslated, tr } from "@/lib/localize";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
type P = Promise<{ locale: string; story: string }>;

export function generateStaticParams() {
  return STORIES.map((s) => ({ story: s.slug }));
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { story: storySlug } = await params;
  const story = STORIES.find((s) => s.slug === storySlug);
  if (!story) return {};
  return pageMetadata(locale, `/heritage/${story.slug}`, tr(story.title, locale), tr(story.intro, locale));
}

export default async function StoryPage({ params }: { params: P }) {
  const { locale, t } = await resolveLocale(params);
  const { story: storySlug } = await params;
  const story = STORIES.find((s) => s.slug === storySlug);
  if (!story) notFound();
  const sites = await getSites();
  const bySlug = new Map(sites.map((s) => [s.slug, s]));
  const translated = isTranslated(story.intro, locale);

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: story.title.en, about: "Babylon", inLanguage: locale, url: `${siteUrl()}/${locale}/heritage/${story.slug}` }} />
      <PageHero eyebrow={t.nav.heritage} title={tr(story.title, locale)} text={tr(story.intro, locale)} />
      <div className="container-x mt-8 flex flex-wrap items-center gap-3">
        <StatusBadge status="unverified" t={t} />
        <span className="text-sm text-charcoal-600">{t.stories.reviewNote}</span>
        {!translated && <span className="text-sm italic text-charcoal-600">{t.common.translationPending}</span>}
      </div>

      <nav aria-label="Sections" className="container-x mt-8">
        <ol className="flex flex-wrap gap-2 text-sm">
          {story.sections.map((s, i) => (
            <li key={s.id}><a href={`#${s.id}`} className="inline-block rounded-full bg-white px-4 py-2 font-medium text-river-900 ring-1 ring-river-900/10 hover:bg-sand-100">{i + 1}. {tr(s.title, locale)}</a></li>
          ))}
        </ol>
      </nav>

      <div className="container-x mt-10 space-y-16">
        {story.sections.map((s, i) => {
          const related = s.relatedSiteSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as typeof sites;
          const photo = related.find((r) => r.images.some((img) => img.verified));
          return (
            <section key={s.id} id={s.id} className="grid scroll-mt-24 gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} · {tr(s.period, locale)}</p>
                <h2 className="font-display mt-2 text-3xl font-bold text-river-900">{tr(s.title, locale)}</h2>
                <div className="prose-it mt-4">{s.paragraphs.map((p, k) => <p key={k}>{tr(p, locale)}</p>)}</div>
                {related.length > 0 && (
                  <div className="mt-5">
                    <p className="label">{t.stories.related}</p>
                    <ul className="flex flex-wrap gap-2">
                      {related.map((r) => <li key={r.id}><Link href={`/${locale}/destinations/${r.slug}`} className="inline-block rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-river-900 ring-1 ring-sand-300 hover:bg-sand-200">{tr(r.name, locale)}</Link></li>)}
                    </ul>
                  </div>
                )}
              </div>
              <aside className="lg:col-span-2">
                {photo ? (
                  <PlaceImage images={photo.images} alt={tr(photo.name, locale)} t={t} className="aspect-[4/3] rounded-2xl" />
                ) : (
                  <div>
                    <PlaceImage images={[]} category="archaeological" alt={tr(s.title, locale)} t={t} className="aspect-[4/3] rounded-2xl" showCaption />
                    <Notice><strong>{t.stories.photoBriefLabel}:</strong> {tr(s.photoBrief, locale)}</Notice>
                  </div>
                )}
              </aside>
            </section>
          );
        })}
      </div>
    </>
  );
}
