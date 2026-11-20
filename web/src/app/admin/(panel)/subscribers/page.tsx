import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, str } from "@/lib/params";
import { deleteSubscriberAction } from "@/actions/admin/engagement";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "مشتركو النشرة" };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("subscriber:manage");
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const [total, subs] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterSubscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
  ]);
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle
        title="مشتركو النشرة البريدية"
        description={`${formatNumber(total)} مشترك. يمكن تصدير القائمة لاستيرادها في أي خدمة بريد (Mailchimp، Brevo…).`}
        actions={<a href="/api/admin/subscribers/export" className="btn-primary">تصدير CSV</a>}
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted"><tr><th className="p-3">البريد</th><th className="p-3">تاريخ الاشتراك</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {subs.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted">لا يوجد مشتركون بعد.</td></tr>}
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="p-3" dir="ltr">{s.email}</td>
                <td className="p-3">{formatDate(s.createdAt)}</td>
                <td className="p-3"><ConfirmAction action={deleteSubscriberAction} fields={{ id: s.id }} label="حذف" message={`حذف ${s.email} من القائمة؟`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 50))} basePath="/admin/subscribers" />
    </>
  );
}
