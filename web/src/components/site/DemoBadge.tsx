import { t } from "@/i18n";

export function DemoBadge() {
  return (
    <span className="badge border border-dashed border-amber-500 bg-amber-50 text-amber-800" title={t.article.demoNotice}>
      {t.article.demo}
    </span>
  );
}
