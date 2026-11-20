import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelated } from "@/lib/articles";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import { decodeParam } from "@/lib/slug";
import { t } from "@/i18n";
import { ArticleCardItem } from "@/components/site/ArticleCard";
import { CommentForm } from "@/components/site/CommentForm";
import { CoverImage } from "@/components/site/CoverImage";
import { JsonLd } from "@/components/site/JsonLd";
import { ShareButtons } from "@/components/site/ShareButtons";
import { ViewTracker } from "@/components/site/ViewTracker";

type Params = Promise<{ slug: string }>;

function absoluteImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return src.startsWith("http") ? src : siteUrl(src);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await getArticleBySlug(decodeParam((await params).slug));
  if (!a) return { title: "المقال غير موجود", robots: { index: false } };
  const title = a.seoTitle || a.title;
  const description = a.seoDescription || a.excerpt || a.subtitle || undefined;
  const image = absoluteImage(a.coverImage);
  const url = `/article/${a.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    authors: [{ name: a.author.name }],
    keywords: a.tags.map((x) => x.tag.name),
    robots: a.isDemo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: a.updatedAt.toISOString(),
      authors: [a.author.name],
      section: a.category?.name,
      tags: a.tags.map((x) => x.tag.name),
      images: image ? [{ url: image, alt: a.coverImageAlt || a.title }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const slug = decodeParam((await params).slug);
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [settings, related, comments] = await Promise.all([
    getSettings(),
    getRelated(article.id, article.categoryId),
    prisma.comment.findMany({
      where: { articleId: article.id, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, authorName: true, content: true, createdAt: true },
      take: 200,
    }),
  ]);
  const url = siteUrl(`/article/${article.slug}`);
  const html = sanitizeArticleHtml(article.content);

  return (
    <>
      <ViewTracker articleId={article.id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          alternativeHeadline: article.subtitle ?? undefined,
          description: article.seoDescription || article.excerpt || undefined,
          image: absoluteImage(article.coverImage) ? [absoluteImage(article.coverImage)] : undefined,
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          inLanguage: "ar",
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          articleSection: article.category?.name,
          keywords: article.tags.map((x) => x.tag.name).join(", ") || undefined,
          author: { "@type": "Person", name: article.author.name, url: siteUrl("/about") },
          publisher: { "@type": "Organization", name: settings.siteName, logo: { "@type": "ImageObject", url: siteUrl("/icon.svg") } },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
            ...(article.category
              ? [{ "@type": "ListItem", position: 2, name: article.category.name, item: siteUrl(`/category/${article.category.slug}`) }]
              : []),
            { "@type": "ListItem", position: article.category ? 3 : 2, name: article.title, item: url },
          ],
        }}
      />

      <article className="bg-white">
        <header className="container-page max-w-4xl pt-8 pb-6 sm:pt-12">
          <nav aria-label="مسار التنقل" className="mb-5 text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-navy-900">الرئيسية</Link></li>
              {article.category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li><Link href={`/category/${article.category.slug}`} className="hover:text-navy-900">{article.category.name}</Link></li>
                </>
              )}
            </ol>
          </nav>
          {article.category && (
            <Link href={`/category/${article.category.slug}`} className="kicker">{article.category.name}</Link>
          )}
          <h1 className="mt-3 text-3xl leading-[1.35] font-extrabold text-navy-900 sm:text-5xl sm:leading-[1.3]">{article.title}</h1>
          {article.subtitle && <p className="mt-4 text-lg leading-8 text-muted sm:text-xl">{article.subtitle}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-4 text-sm text-muted">
            <span>{t.article.by} <Link href="/about" className="font-bold text-navy-900 hover:underline">{article.author.name}</Link></span>
            {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>}
            <span>{formatNumber(article.readingMinutes)} {t.article.minutes}</span>
            <span>{formatNumber(article.views)} {t.article.views}</span>
          </div>
          {article.isDemo && (
            <p role="note" className="mt-5 rounded-md border border-dashed border-amber-500 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              <strong>{t.article.demo}:</strong> {t.article.demoNotice}
            </p>
          )}
        </header>

        {article.coverImage && (
          <figure className="container-page max-w-5xl">
            <CoverImage src={article.coverImage} alt={article.coverImageAlt || article.title} sizes="(min-width: 1024px) 64rem, 100vw" priority className="aspect-[16/9] rounded-lg" />
            {article.coverImageAlt && <figcaption className="mt-2 text-center text-xs text-muted">{article.coverImageAlt}</figcaption>}
          </figure>
        )}

        <div className="container-page max-w-3xl py-10">
          <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />

          {article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-navy-900">{t.article.tags}:</span>
              {article.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`} className="badge bg-navy-100 px-3 py-1 text-navy-800 hover:bg-gold-100">#{tag.name}</Link>
              ))}
            </div>
          )}
          <div className="mt-8 border-t border-line pt-6">
            <ShareButtons url={url} title={article.title} />
          </div>

          <aside className="mt-10 flex gap-4 rounded-lg bg-paper p-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 font-display text-xl font-extrabold text-gold-500">
              {article.author.avatarUrl || settings.authorImage ? (
                <Image src={(article.author.avatarUrl || settings.authorImage)!} alt={article.author.name} fill sizes="3.5rem" className="object-cover object-top" />
              ) : "غ"}
            </div>
            <div>
              <p className="font-bold text-navy-900">{article.author.name}</p>
              <p className="mt-1 text-sm leading-7 text-muted">{article.author.bio || settings.authorShortBio || ""}</p>
              <Link href="/about" className="mt-1 inline-block text-sm font-bold text-gold-600 hover:underline">عن الكاتب</Link>
            </div>
          </aside>

          {settings.commentsEnabled && (
            <section id="comments" aria-labelledby="comments-title" className="mt-12">
              <h2 id="comments-title" className="section-title">{t.article.comments} ({formatNumber(comments.length)})</h2>
              {comments.length === 0 ? (
                <p className="mb-6 text-sm text-muted">{t.article.noComments}</p>
              ) : (
                <ul className="mb-8 space-y-4">
                  {comments.map((c) => (
                    <li key={c.id} className="card p-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted">
                        <strong className="text-sm text-navy-900">{c.authorName}</strong>
                        <time dateTime={c.createdAt.toISOString()}>{formatDate(c.createdAt)}</time>
                      </div>
                      <p className="text-sm leading-7 whitespace-pre-line">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="mb-3 font-bold text-navy-900">{t.article.addComment}</h3>
              <CommentForm articleId={article.id} />
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-page py-12">
          <h2 id="related-title" className="section-title">{t.article.related}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => <ArticleCardItem key={a.id} a={a} />)}
          </div>
        </section>
      )}
    </>
  );
}
