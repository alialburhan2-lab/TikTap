import type { Metadata } from "next";
import { listArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { pageParam, type SearchParams } from "@/lib/params";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleListing } from "@/components/site/ArticleListing";
import { ViewTracker } from "@/components/site/ViewTracker";

export const metadata: Metadata = {
  title: "المقالات",
  description: "جميع المقالات والتحليلات والحوارات والدراسات المنشورة.",
  alternates: { canonical: "/articles" },
};

export default async function ArticlesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const settings = await getSettings();
  const res = await listArticles({ page: pageParam(sp.page), perPage: settings.postsPerPage });
  return (
    <>
      <ViewTracker />
      <PageHeader kicker="المنشورات" title="المقالات" description="جميع ما نُشر على المنصة، مرتباً من الأحدث إلى الأقدم." />
      <div className="container-page py-10">
        <ArticleListing {...res} basePath="/articles" />
      </div>
    </>
  );
}
