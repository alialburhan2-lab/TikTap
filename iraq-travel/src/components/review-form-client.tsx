"use client";

import { useActionState } from "react";
import { submitReview, type FormState } from "@/app/actions/public";

export function ReviewFormClient({ targetType, targetId, labels }: { targetType: string; targetId: string; labels: { submit: string; title: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, { ok: false });
  if (state.ok) return <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Thank you — your review was received and will appear after moderation.</p>;
  return (
    <details className="card mt-4 p-5">
      <summary className="cursor-pointer font-semibold text-river-900">+ {labels.title}</summary>
      <form action={action} className="mt-4 grid gap-3">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="text-sm">Rating
          <select name="rating" className="input mt-1" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
        </label>
        <label className="text-sm">Title<input name="title" required maxLength={120} className="input mt-1" /></label>
        {state.errors?.title && <p className="text-xs text-rose-700">{state.errors.title}</p>}
        <label className="text-sm">Review<textarea name="body" required minLength={20} maxLength={3000} rows={4} className="input mt-1" /></label>
        {state.errors?.body && <p className="text-xs text-rose-700">{state.errors.body}</p>}
        <label className="text-sm">Name<input name="authorName" required maxLength={80} className="input mt-1" /></label>
        {state.message && <p className="text-xs text-rose-700">{state.message}</p>}
        <button className="btn-river justify-self-start" disabled={pending}>{labels.submit}</button>
        <p className="text-xs text-charcoal-600">Reviews are moderated before publication.</p>
      </form>
    </details>
  );
}
