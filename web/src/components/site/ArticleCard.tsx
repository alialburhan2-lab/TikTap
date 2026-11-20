import Link from "next/link";
import type { ArticleCard as Card } from "@/lib/articles";
import { formatDate, formatNumber } from "@/lib/format";
import { t } from "@/i18n";
import { CoverImage } from "./CoverImage";
import { DemoBadge } from "./DemoBadge";

function Meta({ a, light = false }: { a: Card; light?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${light ? "text-navy-100/80" : "text-muted"}`}>
      {a.publishedAt && <time dateTime={new Date(a.publishedAt).toISOString()}>{formatDate(a.publishedAt)}</time>}
      <span aria-hidden="true">•</span>
      <span>{formatNumber(a.readingMinutes)} {t.article.minutes}</span>
    </div>
  );
}

export function LeadArticle({ a }: { a: Card }) {
  return (
    <article className="group relative overflow-hidden rounded-xl bg-navy-900 text-white">
      <Link href={`/article/${a.slug}`} className="block">
        <CoverImage src={a.coverImage} alt={a.coverImageAlt} sizes="(min-width: 1024px) 66vw, 100vw" priority className="aspect-[16/10] sm:aspect-[16/8]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-gold-500 text-navy-900">{t.home.featured}</span>
            {a.category && <span className="badge bg-white/10 text-gold-300">{a.category.name}</span>}
            {a.isDemo && <DemoBadge />}
          </div>
          <h2 className="text-2xl leading-snug font-extrabold sm:text-4xl">{a.title}</h2>
          {a.excerpt && <p className="line-clamp-2 max-w-3xl text-sm leading-7 text-navy-100 sm:text-base">{a.excerpt}</p>}
          <Meta a={a} light />
        </div>
      </Link>
    </article>
  );
}

export function ArticleCardItem({ a }: { a: Card }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:shadow-lg hover:shadow-navy-900/5">
      <Link href={`/article/${a.slug}`} className="flex h-full flex-col">
        <CoverImage src={a.coverImage} alt={a.coverImageAlt} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[16/9]" />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            {a.category && <span className="kicker">{a.category.name}</span>}
            {a.isDemo && <DemoBadge />}
          </div>
          <h3 className="text-lg leading-snug font-extrabold text-navy-900 group-hover:text-navy-700">{a.title}</h3>
          {a.excerpt && <p className="line-clamp-3 text-sm leading-7 text-muted">{a.excerpt}</p>}
          <div className="mt-auto pt-2"><Meta a={a} /></div>
        </div>
      </Link>
    </article>
  );
}

export function ArticleRow({ a, compact = false }: { a: Card; compact?: boolean }) {
  return (
    <article className={`group grid grid-cols-[1fr_6rem] gap-4 border-b border-line py-4 last:border-0 ${compact ? "" : "sm:grid-cols-[1fr_12rem] sm:py-5"}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {a.category && <Link href={`/category/${a.category.slug}`} className="kicker hover:underline">{a.category.name}</Link>}
          {a.isDemo && <DemoBadge />}
        </div>
        <h3 className={`text-base leading-snug font-extrabold text-navy-900 ${compact ? "" : "sm:text-xl"}`}>
          <Link href={`/article/${a.slug}`} className="hover:text-navy-700">{a.title}</Link>
        </h3>
        {a.excerpt && !compact && <p className="line-clamp-2 hidden text-sm leading-7 text-muted sm:block">{a.excerpt}</p>}
        <Meta a={a} />
      </div>
      <Link href={`/article/${a.slug}`} tabIndex={-1} aria-hidden="true">
        <CoverImage src={a.coverImage} alt="" sizes="12rem" className="aspect-[4/3] rounded-md" />
      </Link>
    </article>
  );
}

export function RankedItem({ a, rank }: { a: Card; rank: number }) {
  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-0">
      <span className="font-display text-3xl leading-none font-extrabold text-gold-500">{formatNumber(rank)}</span>
      <div className="space-y-1">
        <Link href={`/article/${a.slug}`} className="block leading-snug font-bold text-navy-900 hover:text-navy-700">{a.title}</Link>
        <span className="text-xs text-muted">{formatNumber(a.views)} {t.article.views}</span>
      </div>
    </li>
  );
}
