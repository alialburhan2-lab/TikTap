import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { listArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { decodeParam } from "@/lib/slug";
import { pageParam, type SearchParams } from "@/lib/params";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleListing } from "@/components/site/ArticleListing";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const tag = await prisma.tag.findUnique({ where: { slug: decodeParam((await params).slug) } });
  if (!tag) return { title: "وسم غير موجود" };
  return { title: `وسم: ${tag.name}`, alternates: { canonical: `/tag/${tag.slug}` } };
}

export default async function TagPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const tag = await prisma.tag.findUnique({ where: { slug: decodeParam(slug) } });
  if (!tag) notFound();
  const settings = await getSettings();
  const res = await listArticles({ tagSlug: tag.slug, page: pageParam(sp.page), perPage: settings.postsPerPage });
  return (
    <>
      <PageHeader kicker="وسم" title={`#${tag.name}`} />
      <div className="container-page py-10">
        <ArticleListing {...res} basePath={`/tag/${tag.slug}`} />
      </div>
    </>
  );
}
