import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { str } from "@/lib/params";
import { deleteTagAction, saveTagAction } from "@/actions/admin/taxonomy";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";

export const metadata = { title: "الوسوم" };

export default async function TagsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("tag:manage");
  const sp = await searchParams;
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { articles: true } } } });
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="إدارة الوسوم" description="تُنشأ الوسوم تلقائياً عند إضافتها للمقالات، ويمكن إدارتها هنا." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="card divide-y divide-line">
          {tags.length === 0 && <p className="p-6 text-center text-muted">لا توجد وسوم.</p>}
          {tags.map((t) => (
            <details key={t.id} className="p-4">
              <summary className="cursor-pointer">
                <span className="font-bold text-navy-900">#{t.name}</span>
                <span className="mr-2 text-xs text-muted">/{t.slug} — {formatNumber(t._count.articles)} مقال</span>
              </summary>
              <div className="mt-3 space-y-3">
                <ActionForm action={saveTagAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" submitLabel="حفظ">
                  <input type="hidden" name="id" value={t.id} />
                  <div><label className="label">الاسم</label><input name="name" defaultValue={t.name} className="input" /><Err name="name" /></div>
                  <div><label className="label">Slug</label><input name="slug" defaultValue={t.slug} className="input" /><Err name="slug" /></div>
                </ActionForm>
                <ConfirmAction action={deleteTagAction} fields={{ id: t.id }} label="حذف الوسم" message={`سيُحذف الوسم «${t.name}» ويُزال من جميع المقالات.`} />
              </div>
            </details>
          ))}
        </div>
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-extrabold text-navy-900">إضافة وسم</h2>
          <ActionForm action={saveTagAction} resetOnSuccess submitLabel="إضافة">
            <div><label className="label">الاسم *</label><input name="name" className="input" required /><Err name="name" /></div>
            <div><label className="label">Slug</label><input name="slug" className="input" placeholder="تلقائي" /><Err name="slug" /></div>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
