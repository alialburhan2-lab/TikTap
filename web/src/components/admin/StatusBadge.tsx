import type { ArticleStatus } from "@prisma/client";

const STYLES: Record<ArticleStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REVIEW: "bg-amber-100 text-amber-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-navy-100 text-navy-800",
};

export function StatusBadge({ status, label }: { status: ArticleStatus; label: string }) {
  return <span className={`badge ${STYLES[status]}`}>{label}</span>;
}
