import type { Metadata } from "next";
import Image from "next/image";
import { getSettings, socialLinks } from "@/lib/settings";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { siteUrl } from "@/lib/site-url";
import { getLatest } from "@/lib/articles";
import { AUTHOR_GALLERY } from "@/lib/author-photos";
import { JsonLd } from "@/components/site/JsonLd";
import { ArticleRow } from "@/components/site/ArticleCard";
import { ViewTracker } from "@/components/site/ViewTracker";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `${s.authorName} — السيرة الذاتية`,
    description: s.authorShortBio ?? `نبذة عن الكاتب ${s.authorName}`,
    alternates: { canonical: "/about" },
    openGraph: { type: "profile", title: s.authorName },
  };
}

export default async function AboutPage() {
  const [s, latest] = await Promise.all([getSettings(), getLatest(4)]);
  const social = Object.values(socialLinks(s)).filter(Boolean) as string[];
  return (
    <>
      <ViewTracker />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: s.authorName,
          jobTitle: s.authorTitle ?? undefined,
          description: s.authorShortBio ?? undefined,
          image: s.authorImage ? (s.authorImage.startsWith("http") ? s.authorImage : siteUrl(s.authorImage)) : undefined,
          url: siteUrl("/about"),
          sameAs: social.length ? social : undefined,
        }}
      />
      <section className="bg-navy-900 text-white">
        <div className="container-page grid items-center gap-8 py-12 sm:py-16 md:grid-cols-[14rem_1fr]">
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full border-4 border-gold-500 bg-navy-800 md:h-56 md:w-56">
            {s.authorImage ? (
              <Image src={s.authorImage} alt={s.authorName} fill priority sizes="14rem" className="object-cover object-top" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-7xl font-extrabold text-gold-500">غ</div>
            )}
          </div>
          <div className="space-y-3 text-center md:text-right">
            <p className="kicker text-gold-300">الكاتب</p>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{s.authorName}</h1>
            {s.authorTitle && <p className="text-lg text-gold-300">{s.authorTitle}</p>}
            {s.authorShortBio && <p className="max-w-2xl leading-8 text-navy-100/85">{s.authorShortBio}</p>}
          </div>
        </div>
      </section>
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="section-title">السيرة الذاتية</h2>
          {s.authorBio ? (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(s.authorBio) }} />
          ) : (
            <p className="card p-6 text-muted">لم تُضف السيرة الذاتية بعد. يمكن تحريرها من لوحة الإدارة ← بيانات الكاتب.</p>
          )}
          <h2 className="section-title mt-12">معرض الصور</h2>
          <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-3">
            {AUTHOR_GALLERY.map((p, i) => (
              <li key={p.src} className="break-inside-avoid overflow-hidden rounded-lg bg-navy-100">
                <Image src={p.src} alt={`${s.authorName} — صورة ${i + 1}`} width={p.w} height={p.h} sizes="(min-width: 640px) 22vw, 45vw" className="h-auto w-full transition duration-500 hover:scale-[1.03]" />
              </li>
            ))}
          </ul>
        </div>
        {latest.length > 0 && (
          <aside>
            <h2 className="section-title text-lg">أحدث الكتابات</h2>
            <div className="card px-4">{latest.map((a) => <ArticleRow key={a.id} a={a} compact />)}</div>
          </aside>
        )}
      </div>
    </>
  );
}
