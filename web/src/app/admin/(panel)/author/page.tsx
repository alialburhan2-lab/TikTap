import { requirePermission } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { saveAuthorAction } from "@/actions/admin/settings";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { PageTitle } from "@/components/admin/PageTitle";
import { RichEditor } from "@/components/admin/RichEditor";

export const metadata = { title: "بيانات الكاتب" };

export default async function AuthorPage() {
  await requirePermission("author:manage");
  const s = await getSettings();
  return (
    <>
      <PageTitle title="بيانات الكاتب" description="تظهر في صفحة «الكاتب» وفي قسم «عن الكاتب» بالصفحة الرئيسية." />
      <ActionForm action={saveAuthorAction} className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_18rem]" submitLabel="حفظ بيانات الكاتب">
        <div className="card space-y-4 p-6">
          <div><label className="label">الاسم</label><input name="authorName" defaultValue={s.authorName} className="input" /><Err name="authorName" /></div>
          <div><label className="label">الصفة / المسمى</label><input name="authorTitle" defaultValue={s.authorTitle ?? ""} className="input" placeholder="مثال: كاتب وصحفي" /><Err name="authorTitle" /></div>
          <div><label className="label">نبذة مختصرة</label><textarea name="authorShortBio" defaultValue={s.authorShortBio ?? ""} rows={3} maxLength={600} className="input" /><Err name="authorShortBio" /></div>
          <div><span className="label">السيرة الذاتية الكاملة</span><RichEditor name="authorBio" defaultValue={s.authorBio ?? ""} placeholder="اكتب السيرة الذاتية…" /></div>
        </div>
        <div className="card h-fit p-5">
          <ImagePicker name="authorImage" defaultValue={s.authorImage} label="صورة الكاتب" />
          <Err name="authorImage" />
        </div>
      </ActionForm>
    </>
  );
}
