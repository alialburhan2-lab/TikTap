import type { Review } from "@/data/types";
import type { Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionary";
import { DemoBadge } from "./badges";
import { ReviewFormClient } from "./review-form-client";

export function ReviewList({ reviews, t }: { reviews: Review[]; t: Dictionary }) {
  if (!reviews.length) return <p className="mt-4 text-sm italic text-charcoal-600">{t.common.noReviews}</p>;
  return (
    <ul className="mt-4 space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="card p-5">
          <div className="flex items-center gap-2">
            <span className="text-gold-500" aria-label={`${r.rating}/5`}>{"★".repeat(r.rating)}<span className="text-sand-300">{"★".repeat(5 - r.rating)}</span></span>
            {r.isDemo && <DemoBadge t={t} />}
          </div>
          <p className="mt-1 font-semibold text-river-900">{r.title}</p>
          <p className="mt-1 text-sm text-charcoal-600">{r.body}</p>
          <p className="mt-2 text-xs text-charcoal-600">— {r.authorName}</p>
        </li>
      ))}
    </ul>
  );
}

export function ReviewForm({ targetType, targetId, locale }: { targetType: Review["targetType"]; targetId: string; locale: Locale }) {
  const t = getDictionary(locale);
  return <ReviewFormClient targetType={targetType} targetId={targetId} labels={{ submit: t.common.submit, title: t.common.reviews }} />;
}
