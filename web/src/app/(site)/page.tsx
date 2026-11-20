import Image from "next/image";
import Link from "next/link";
import { getFeatured, getLatest, getMostRead, getNavCategories, listArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import { t } from "@/i18n";
import { ArticleCardItem, ArticleRow, LeadArticle, RankedItem } from "@/components/site/ArticleCard";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { JsonLd } from "@/components/site/JsonLd";
import { ViewTracker } from "@/components/site/ViewTracker";

export default async function HomePage() {
  const [settings, featured, mostRead, categories] = await Promise.all([
    getSettings(),
    getFeatured(),
    getMostRead(5),
    getNavCategories(),
  ]);
  const latest = await getLatest(10, featured ? [featured.id] : []);
  const side = latest.slice(0, 4);
  const grid = latest.slice(4, 10);
  const sections = (
    await Promise.all(
      categories.slice(0, 5).map(async (c) => ({ c, items: (await listArticles({ categorySlug: c.slug, perPage: 3 })).items })),
    )
  ).filter((s) => s.items.length > 0);

  return (
    <>
      <ViewTracker />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.siteName,
          url: siteUrl(),
          inLanguage: "ar",
          description: settings.siteDescription,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl("/search")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-900 text-white">
        {settings.heroImage && (
          <div className="absolute inset-y-0 left-0 -z-20 w-full md:w-3/5">
            <Image src={settings.heroImage} alt="" fill priority sizes="(min-width: 768px) 60vw, 100vw" className="object-cover object-[30%_45%] md:object-[40%_60%]" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-navy-950/75 md:bg-transparent md:bg-gradient-to-l md:from-navy-950 md:from-40% md:via-navy-900/85 md:via-55% md:to-transparent" />
        <div className="container-page relative flex min-h-[26rem] flex-col justify-center gap-6 py-14 sm:min-h-[32rem] sm:py-20">
          <div className="max-w-2xl space-y-4">
            <p className="kicker text-gold-300">{settings.siteName} | المنصة الرسمية</p>
            <h1 className="text-4xl leading-tight font-extrabold drop-shadow sm:text-6xl">{settings.siteTagline}</h1>
            <div className="h-1 w-20 rounded-full bg-gold-500" />
            <p className="leading-8 text-navy-100/90 sm:text-lg">{settings.siteDescription}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/articles" className="btn-gold">تصفح المقالات</Link>
              <Link href="/about" className="btn border border-gold-500/60 text-gold-300 backdrop-blur-sm hover:bg-white/10">عن الكاتب</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 py-10 sm:py-14">
        {!featured ? (
          <p className="card p-10 text-center text-muted">{t.home.empty}</p>
        ) : (
          <section aria-labelledby="featured-title" className="grid gap-8 lg:grid-cols-3">
            <h2 id="featured-title" className="sr-only">{t.home.featured}</h2>
            <div className="lg:col-span-2"><LeadArticle a={featured} /></div>
            <div className="card px-5">
              <h2 className="section-title mt-5 mb-1 text-lg">{t.home.latest}</h2>
              {side.map((a) => <ArticleRow key={a.id} a={a} compact />)}
            </div>
          </section>
        )}

        {(grid.length > 0 || mostRead.length > 0) && (
          <section className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-baseline justify-between">
                <h2 className="section-title">{t.home.latest}</h2>
                <Link href="/articles" className="text-sm font-bold text-gold-600 hover:underline">{t.home.viewAll}</Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {grid.map((a) => <ArticleCardItem key={a.id} a={a} />)}
              </div>
            </div>
            <aside aria-labelledby="most-read">
              <h2 id="most-read" className="section-title">{t.home.mostRead}</h2>
              <ol className="card px-5">
                {mostRead.map((a, i) => <RankedItem key={a.id} a={a} rank={i + 1} />)}
              </ol>
            </aside>
          </section>
        )}

        {categories.length > 0 && (
          <section aria-labelledby="sections-title">
            <h2 id="sections-title" className="section-title">{t.home.sections}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="group card flex h-full flex-col gap-1 p-4 transition hover:border-gold-500">
                    <span className="font-display text-lg font-extrabold text-navy-900">{c.name}</span>
                    {c.description && <span className="line-clamp-2 text-xs leading-6 text-muted">{c.description}</span>}
                    <span className="mt-auto pt-2 text-xs font-bold text-gold-600 group-hover:underline">تصفح القسم ←</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections.map(({ c, items }) => (
          <section key={c.id} aria-labelledby={`sec-${c.id}`}>
            <div className="flex items-baseline justify-between border-b-2 border-navy-900 pb-2">
              <h2 id={`sec-${c.id}`} className="section-title mb-0">{c.name}</h2>
              <Link href={`/category/${c.slug}`} className="text-sm font-bold text-gold-600 hover:underline">{t.home.viewAll}</Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => <ArticleCardItem key={a.id} a={a} />)}
            </div>
          </section>
        ))}

        <section aria-labelledby="about-title" className="overflow-hidden rounded-xl bg-navy-900 text-white">
          <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[12rem_1fr]">
            <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-gold-500 bg-navy-800 md:h-48 md:w-48">
              {settings.authorImage ? (
                <Image src={settings.authorImage} alt={settings.authorName} fill sizes="12rem" className="object-cover object-top" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-6xl font-extrabold text-gold-500">غ</div>
              )}
            </div>
            <div className="space-y-3 text-center md:text-right">
              <p className="kicker text-gold-300">{t.home.aboutAuthor}</p>
              <h2 id="about-title" className="text-2xl font-extrabold sm:text-3xl">{settings.authorName}</h2>
              {settings.authorTitle && <p className="text-gold-300">{settings.authorTitle}</p>}
              <p className="leading-8 text-navy-100/85">
                {settings.authorShortBio || "يمكن إضافة نبذة الكاتب من لوحة الإدارة."}
              </p>
              <Link href="/about" className="btn-gold mt-2">{t.home.readBio}</Link>
            </div>
          </div>
        </section>

        {settings.newsletterEnabled && (
          <section aria-labelledby="nl-title" className="card grid items-center gap-6 border-gold-300 bg-gold-100 p-6 sm:p-10 md:grid-cols-2">
            <div className="space-y-2">
              <h2 id="nl-title" className="text-2xl font-extrabold text-navy-900">{t.newsletter.title}</h2>
              <p className="leading-8 text-muted">{t.newsletter.text}</p>
            </div>
            <NewsletterForm />
          </section>
        )}
      </div>
    </>
  );
}
