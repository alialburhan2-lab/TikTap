import { requireUser } from "@/lib/auth-guard";
import { ROLE_LABELS } from "@/lib/permissions";
import { updateProfileAction } from "@/actions/admin/users";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "ملفي الشخصي" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="ملفي الشخصي" description={`${user.email} — ${ROLE_LABELS[user.role]}`} />
      <ActionForm action={updateProfileAction} className="card max-w-2xl space-y-4 p-6">
        <div><label className="label">الاسم المعروض</label><input name="name" defaultValue={user.name} className="input" /><Err name="name" /></div>
        <div><label className="label">نبذة قصيرة (تظهر أسفل مقالاتك)</label><textarea name="bio" defaultValue={user.bio ?? ""} rows={3} maxLength={1000} className="input" /><Err name="bio" /></div>
        <ImagePicker name="avatarUrl" defaultValue={user.avatarUrl} label="الصورة الشخصية" />
        <fieldset className="space-y-3 rounded-md border border-line p-4">
          <legend className="px-2 text-sm font-bold">تغيير كلمة المرور</legend>
          <div><label className="label">كلمة المرور الحالية</label><input name="currentPassword" type="password" autoComplete="current-password" dir="ltr" className="input" /><Err name="currentPassword" /></div>
          <div><label className="label">كلمة المرور الجديدة</label><input name="newPassword" type="password" autoComplete="new-password" dir="ltr" className="input" /><Err name="newPassword" /></div>
        </fieldset>
      </ActionForm>
    </>
  );
}
