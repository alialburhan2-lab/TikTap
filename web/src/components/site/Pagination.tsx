import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { t } from "@/i18n";

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  return (
    <nav aria-label="ترقيم الصفحات" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link rel="prev" className="btn-outline" href={href(page - 1)}>{t.common.prev}</Link>}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`btn min-w-10 ${p === page ? "bg-navy-900 text-white" : "border border-line bg-white text-navy-900"}`}
        >
          {formatNumber(p)}
        </Link>
      ))}
      {page < totalPages && <Link rel="next" className="btn-outline" href={href(page + 1)}>{t.common.next}</Link>}
      <span className="w-full text-center text-xs text-muted">
        {t.common.page} {formatNumber(page)} {t.common.of} {formatNumber(totalPages)}
      </span>
    </nav>
  );
}
