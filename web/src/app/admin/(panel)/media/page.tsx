import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, str } from "@/lib/params";
import { deleteMediaAction, updateMediaAltAction } from "@/actions/admin/media";
import { ActionForm } from "@/components/admin/ActionForm";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "الوسائط" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("media:upload");
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where = can(user.role, "media:manage") ? {} : { uploadedById: user.id };
  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 24, take: 24, include: { uploadedBy: { select: { name: true } } } }),
  ]);
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="مكتبة الوسائط" description={`${formatNumber(total)} صورة`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div>
          {items.length === 0 ? (
            <p className="card p-10 text-center text-muted">لا توجد صور بعد.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <li key={m.id} className="card overflow-hidden" data-testid="media-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-video w-full bg-paper object-cover" loading="lazy" />
                  <div className="space-y-2 p-3 text-xs">
                    <p className="text-muted">
                      {m.width}×{m.height} — {formatNumber(Math.round(m.size / 1024))} ك.ب — {formatDate(m.createdAt)}
                      {m.uploadedBy && ` — ${m.uploadedBy.name}`}
                    </p>
                    <input readOnly value={m.url} dir="ltr" className="input py-1 text-left text-xs" aria-label="رابط الصورة" />
                    <ActionForm action={updateMediaAltAction} className="flex items-end gap-2" submitLabel="حفظ" submitClassName="btn-outline px-3 py-2 text-xs">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="alt" defaultValue={m.alt ?? ""} placeholder="النص البديل" className="input py-1.5 text-xs" aria-label="النص البديل" />
                    </ActionForm>
                    <ConfirmAction action={deleteMediaAction} fields={{ id: m.id }} label="حذف" message="سيتم حذف الصورة نهائياً. إذا كانت مستخدمة في مقال فلن تظهر بعد الآن." />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 24))} basePath="/admin/media" />
        </div>
        <MediaUploader />
      </div>
    </>
  );
}
