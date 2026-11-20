import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { DEFAULT_PRIVACY } from "@/lib/legal-defaults";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "سياسة الخصوصية", alternates: { canonical: "/privacy" } };

export default async function Page() {
  const s = await getSettings();
  const html = sanitizeArticleHtml(s.privacyPolicy || DEFAULT_PRIVACY);
  return (
    <>
      <PageHeader title="سياسة الخصوصية" description={`آخر تحديث: ${new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(s.updatedAt)}`} />
      <div className="container-page max-w-3xl py-10">
        <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
