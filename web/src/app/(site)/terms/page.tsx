import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { DEFAULT_TERMS } from "@/lib/legal-defaults";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "شروط الاستخدام", alternates: { canonical: "/terms" } };

export default async function Page() {
  const s = await getSettings();
  const html = sanitizeArticleHtml(s.termsOfUse || DEFAULT_TERMS);
  return (
    <>
      <PageHeader title="شروط الاستخدام" description={`آخر تحديث: ${new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(s.updatedAt)}`} />
      <div className="container-page max-w-3xl py-10">
        <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
