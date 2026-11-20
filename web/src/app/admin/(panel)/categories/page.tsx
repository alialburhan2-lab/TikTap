import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { str } from "@/lib/params";
import { deleteCategoryAction, saveCategoryAction } from "@/actions/admin/taxonomy";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";

export const metadata = { title: "التصنيفات" };

function Fields({ c }: { c?: { name: string; slug: string; description: string | null; sortOrder: number; showInNav: boolean } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">الاسم *</label>
        <input name="name" defaultValue={c?.name} className="input" required maxLength={80} />
        <Err name="name" />
      </div>
      <div>
        <label className="label">Slug</label>
        <input name="slug" defaultValue={c?.slug} className="input" maxLength={80} placeholder="تلقائي" />
        <Err name="slug" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">الوصف</label>
        <input name="description" defaultValue={c?.description ?? ""} className="input" maxLength={300} />
      </div>
      <div>
        <label className="label">الترتيب</label>
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={c?.sortOrder ?? 0} className="input" />
      </div>
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold">
        <input type="checkbox" name="showInNav" defaultChecked={c?.showInNav ?? true} className="h-4 w-4 accent-navy-900" />
        إظهار في القائمة الرئيسية
      </label>
    </div>
  );
}

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("category:manage");
  const sp = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { articles: true } } } });
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="إدارة التصنيفات" description="الأقسام التي تُصنَّف ضمنها المقالات وتظهر في قائمة الموقع." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="card divide-y divide-line">
          {categories.length === 0 && <p className="p-6 text-center text-muted">لا توجد تصنيفات.</p>}
          {categories.map((c) => (
            <details key={c.id} className="group p-4" data-testid="category-row">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-bold text-navy-900">{c.name}</span>
                  <span className="mr-2 text-xs text-muted">/{c.slug} — {formatNumber(c._count.articles)} مقال {c.showInNav ? "" : "— مخفي من القائمة"}</span>
                </span>
                <span className="text-xs font-bold text-gold-600 group-open:hidden">تعديل</span>
              </summary>
              <div className="mt-4 space-y-3">
                <ActionForm action={saveCategoryAction} submitLabel="حفظ التعديل">
                  <input type="hidden" name="id" value={c.id} />
                  <Fields c={c} />
                </ActionForm>
                <ConfirmAction
                  action={deleteCategoryAction}
                  fields={{ id: c.id }}
                  label="حذف التصنيف"
                  message={`سيتم حذف «${c.name}». المقالات المرتبطة (${c._count.articles}) ستبقى دون تصنيف.`}
                />
              </div>
            </details>
          ))}
        </div>
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-extrabold text-navy-900">إضافة تصنيف</h2>
          <ActionForm action={saveCategoryAction} resetOnSuccess submitLabel="إضافة" testId="category-create">
            <Fields />
          </ActionForm>
        </div>
      </div>
    </>
  );
}
