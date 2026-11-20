import { requirePermission } from "@/lib/auth-guard";
import { getSettings, socialLinks } from "@/lib/settings";
import { DEFAULT_PRIVACY, DEFAULT_TERMS } from "@/lib/legal-defaults";
import { saveSettingsAction } from "@/actions/admin/settings";
import { ActionForm, Err } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichEditor } from "@/components/admin/RichEditor";

export const metadata = { title: "إعدادات الموقع" };

const SOCIAL = [
  ["x", "X (تويتر)"], ["facebook", "فيسبوك"], ["instagram", "إنستغرام"], ["youtube", "يوتيوب"], ["telegram", "تيليغرام"], ["linkedin", "لينكدإن"],
] as const;

export default async function SettingsPage() {
  await requirePermission("settings:manage");
  const s = await getSettings();
  const social = socialLinks(s);
  return (
    <>
      <PageTitle title="إعدادات الموقع" />
      <ActionForm action={saveSettingsAction} className="max-w-4xl space-y-6" submitLabel="حفظ الإعدادات">
        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-extrabold text-navy-900 sm:col-span-2">الهوية</h2>
          <div><label className="label">اسم الموقع</label><input name="siteName" defaultValue={s.siteName} className="input" /><Err name="siteName" /></div>
          <div><label className="label">الشعار النصي</label><input name="siteTagline" defaultValue={s.siteTagline} className="input" /><Err name="siteTagline" /></div>
          <div className="sm:col-span-2"><label className="label">وصف الموقع (SEO)</label><textarea name="siteDescription" defaultValue={s.siteDescription} rows={2} maxLength={400} className="input" /><Err name="siteDescription" /></div>
          <div><label className="label">بريد التواصل العام</label><input name="contactEmail" type="email" dir="ltr" defaultValue={s.contactEmail ?? ""} className="input" /><Err name="contactEmail" /></div>
          <div><label className="label">عدد المقالات في الصفحة</label><input name="postsPerPage" type="number" min={3} max={48} defaultValue={s.postsPerPage} className="input" /><Err name="postsPerPage" /></div>
          <div className="sm:col-span-2"><label className="label">نص التذييل</label><input name="footerText" defaultValue={s.footerText ?? ""} className="input" /></div>
          <div className="sm:col-span-2"><ImagePicker name="heroImage" defaultValue={s.heroImage} label="خلفية القسم الرئيسي (Hero)" /><Err name="heroImage" /></div>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="commentsEnabled" defaultChecked={s.commentsEnabled} className="h-4 w-4 accent-navy-900" />تفعيل التعليقات</label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="newsletterEnabled" defaultChecked={s.newsletterEnabled} className="h-4 w-4 accent-navy-900" />تفعيل النشرة البريدية</label>
        </section>
        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-extrabold text-navy-900 sm:col-span-2">حسابات التواصل الاجتماعي</h2>
          {SOCIAL.map(([k, label]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input name={`social_${k}`} defaultValue={social[k] ?? ""} dir="ltr" placeholder="https://" className="input" />
              <Err name={`social_${k}`} />
            </div>
          ))}
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-extrabold text-navy-900">الصفحات القانونية</h2>
          <div><span className="label">سياسة الخصوصية</span><RichEditor name="privacyPolicy" defaultValue={s.privacyPolicy || DEFAULT_PRIVACY} /></div>
          <div><span className="label">شروط الاستخدام</span><RichEditor name="termsOfUse" defaultValue={s.termsOfUse || DEFAULT_TERMS} /></div>
        </section>
      </ActionForm>
    </>
  );
}
