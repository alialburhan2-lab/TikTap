import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { listArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { decodeParam } from "@/lib/slug";
import { pageParam, type SearchParams } from "@/lib/params";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleListing } from "@/components/site/ArticleListing";
import { ViewTracker } from "@/components/site/ViewTracker";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return prisma.category.findUnique({ where: { slug: decodeParam(slug) } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return { title: "قسم غير موجود" };
  return {
    title: c.name,
    description: c.description ?? `مقالات قسم ${c.name}`,
    alternates: { canonical: `/category/${c.slug}` },
    openGraph: { title: c.name, description: c.description ?? undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await load(slug);
  if (!category) notFound();
  const settings = await getSettings();
  const res = await listArticles({ categorySlug: category.slug, page: pageParam(sp.page), perPage: settings.postsPerPage });
  return (
    <>
      <ViewTracker />
      <PageHeader kicker="قسم" title={category.name} description={category.description} />
      <div className="container-page py-10">
        <ArticleListing {...res} basePath={`/category/${category.slug}`} />
      </div>
    </>
  );
}
