import type { ArticleCard } from "@/lib/articles";
import { ArticleCardItem } from "./ArticleCard";
import { Pagination } from "./Pagination";

export function ArticleListing({
  items,
  page,
  totalPages,
  basePath,
  params,
  empty = "لا توجد مقالات في هذا القسم بعد.",
}: {
  items: ArticleCard[];
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  empty?: string;
}) {
  if (items.length === 0) return <p className="card p-10 text-center text-muted">{empty}</p>;
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <ArticleCardItem key={a.id} a={a} />)}
      </div>
      <Pagination page={page} totalPages={totalPages} basePath={basePath} params={params} />
    </>
  );
}
