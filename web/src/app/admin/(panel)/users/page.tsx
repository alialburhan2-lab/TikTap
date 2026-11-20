import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, ROLES } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { str } from "@/lib/params";
import { createUserAction, deleteUserAction, updateUserAction } from "@/actions/admin/users";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";

export const metadata = { title: "المستخدمون والصلاحيات" };

const ROLE_HELP: Record<string, string> = {
  OWNER: "صلاحية كاملة على الإعدادات والمستخدمين والمحتوى والنشر.",
  EDITOR: "إضافة وتعديل المقالات وإرسالها للمراجعة، وإدارة التصنيفات والوسوم والوسائط والتعليقات.",
  AUTHOR: "كتابة المقالات وإدارة مسوداته الخاصة فقط.",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requirePermission("user:manage");
  const sp = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { articles: true } } } });
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="المستخدمون والصلاحيات" description="المالك فقط يستطيع إدارة المستخدمين وتعيين الأدوار." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r} className="card p-4 text-sm">
            <p className="font-extrabold text-navy-900">{ROLE_LABELS[r]} <span className="text-xs text-muted">({r})</span></p>
            <p className="mt-1 leading-6 text-muted">{ROLE_HELP[r]}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="card divide-y divide-line">
          {users.map((u) => (
            <details key={u.id} className="p-4" data-testid="user-row">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-bold text-navy-900">{u.name}</span>
                  <span className="mr-2 text-xs text-muted" dir="ltr">{u.email}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="badge bg-navy-100 text-navy-800">{ROLE_LABELS[u.role]}</span>
                  {!u.active && <span className="badge bg-red-100 text-red-800">معطّل</span>}
                  <span className="text-muted">{formatNumber(u._count.articles)} مقال — آخر دخول: {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</span>
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                <ActionForm action={updateUserAction} className="grid gap-3 sm:grid-cols-2" submitLabel="حفظ">
                  <input type="hidden" name="id" value={u.id} />
                  <div><label className="label">الاسم</label><input name="name" defaultValue={u.name} className="input" /><Err name="name" /></div>
                  <div>
                    <label className="label">الدور</label>
                    <select name="role" defaultValue={u.role} className="input" disabled={u.id === me.id}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    {u.id === me.id && <input type="hidden" name="role" value={u.role} />}
                  </div>
                  <div>
                    <label className="label">كلمة مرور جديدة</label>
                    <input name="password" type="password" autoComplete="new-password" dir="ltr" className="input" placeholder="اتركها فارغة لعدم التغيير" />
                    <Err name="password" />
                  </div>
                  <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold">
                    <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} className="h-4 w-4 accent-navy-900" />
                    {u.id === me.id && <input type="hidden" name="active" value="on" />}
                    الحساب نشط
                  </label>
                </ActionForm>
                {u.id !== me.id && (
                  <ConfirmAction action={deleteUserAction} fields={{ id: u.id }} label="حذف المستخدم" message={`سيتم حذف حساب «${u.name}» نهائياً.`} />
                )}
              </div>
            </details>
          ))}
        </div>
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-extrabold text-navy-900">إضافة مستخدم</h2>
          <ActionForm action={createUserAction} resetOnSuccess submitLabel="إنشاء الحساب" testId="user-create">
            <div><label className="label">الاسم *</label><input name="name" className="input" /><Err name="name" /></div>
            <div><label className="label">البريد الإلكتروني *</label><input name="email" type="email" dir="ltr" className="input" /><Err name="email" /></div>
            <div>
              <label className="label">الدور *</label>
              <select name="role" defaultValue="AUTHOR" className="input">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">كلمة المرور *</label>
              <input name="password" type="password" autoComplete="new-password" dir="ltr" className="input" />
              <p className="mt-1 text-xs text-muted">10 أحرف على الأقل، تتضمن حروفاً وأرقاماً.</p>
              <Err name="password" />
            </div>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
