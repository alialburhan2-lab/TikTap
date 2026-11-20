import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { allowedStatuses, can } from "@/lib/permissions";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "مقال جديد" };

export default async function NewArticlePage() {
  const user = await requirePermission("article:create");
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageTitle title="كتابة مقال جديد" />
      <ArticleForm
        categories={categories}
        statuses={allowedStatuses(user.role)}
        canFeature={can(user.role, "article:publish")}
        values={{
          title: "", slug: "", subtitle: "", excerpt: "", content: "", coverImage: "", coverImageAlt: "",
          categoryId: "", tags: "", status: "DRAFT", publishedAt: null, featured: false, seoTitle: "", seoDescription: "",
        }}
      />
    </>
  );
}
