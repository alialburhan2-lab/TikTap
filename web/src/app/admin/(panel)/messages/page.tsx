import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, str } from "@/lib/params";
import { deleteMessageAction, toggleMessageReadAction } from "@/actions/admin/engagement";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "رسائل التواصل" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("message:manage");
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const [total, unread, messages] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
  ]);
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="رسائل التواصل" description={`${formatNumber(total)} رسالة — ${formatNumber(unread)} غير مقروءة`} />
      <div className="space-y-3">
        {messages.length === 0 && <p className="card p-8 text-center text-muted">لا توجد رسائل.</p>}
        {messages.map((m) => (
          <details key={m.id} className={`card p-4 ${m.read ? "" : "border-gold-500"}`}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-navy-900">{!m.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-gold-500" />}{m.subject}</span>
              <span className="text-xs text-muted">{m.name} — {formatDate(m.createdAt)}</span>
            </summary>
            <div className="mt-3 space-y-3 text-sm">
              <p>من: {m.name} — <a dir="ltr" className="font-bold text-navy-800 hover:underline" href={`mailto:${m.email}?subject=${encodeURIComponent("رد: " + m.subject)}`}>{m.email}</a></p>
              <p className="rounded bg-paper p-3 leading-7 whitespace-pre-line">{m.message}</p>
              <div className="flex gap-2">
                <form action={toggleMessageReadAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                  <button className="btn-outline px-3 py-1.5 text-xs">{m.read ? "تعليم كغير مقروءة" : "تعليم كمقروءة"}</button>
                </form>
                <ConfirmAction action={deleteMessageAction} fields={{ id: m.id }} label="حذف" message="سيتم حذف الرسالة نهائياً." />
              </div>
            </div>
          </details>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 20))} basePath="/admin/messages" />
    </>
  );
}
