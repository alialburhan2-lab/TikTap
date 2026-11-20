import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/site/PageHeader";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "اتصل بنا",
  description: "تواصل مع الكاتب لإرسال استفسار أو مقترح أو طلب حوار.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader kicker="تواصل" title="اتصل بنا" description="لإرسال استفسار أو مقترح أو طلب حوار صحفي، يرجى ملء النموذج التالي." />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <ContactForm />
        <aside className="card h-fit space-y-3 p-6 text-sm leading-7">
          <h2 className="font-bold text-navy-900">معلومات التواصل</h2>
          {s.contactEmail ? (
            <p>البريد الإلكتروني: <a dir="ltr" className="font-bold text-navy-800 hover:underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>
          ) : (
            <p className="text-muted">تُستقبل الرسائل عبر النموذج وتظهر في لوحة الإدارة.</p>
          )}
          <p className="text-muted">نحترم خصوصيتك؛ لا تُستخدم بياناتك إلا للرد على رسالتك.</p>
        </aside>
      </div>
    </>
  );
}
