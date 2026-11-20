"use client";

import { useActionState } from "react";
import { submitComment, type FormState } from "@/actions/public";

export function CommentForm({ articleId }: { articleId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitComment, {});
  if (state.ok) {
    return <p role="status" className="rounded-md bg-green-50 p-4 text-sm text-green-800">{state.message}</p>;
  }
  return (
    <form action={action} className="card space-y-4 p-5" noValidate>
      <input type="hidden" name="articleId" value={articleId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">الاسم</label>
          <input id="c-name" name="authorName" className="input" required maxLength={80} />
          {state.errors?.authorName && <p className="field-error">{state.errors.authorName}</p>}
        </div>
        <div>
          <label className="label" htmlFor="c-email">البريد الإلكتروني (لن يُنشر)</label>
          <input id="c-email" name="authorEmail" type="email" dir="ltr" className="input text-left" required maxLength={200} />
          {state.errors?.authorEmail && <p className="field-error">{state.errors.authorEmail}</p>}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-content">التعليق</label>
        <textarea id="c-content" name="content" rows={4} className="input" required maxLength={3000} />
        {state.errors?.content && <p className="field-error">{state.errors.content}</p>}
      </div>
      {state.message && !state.ok && <p className="field-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "جارٍ الإرسال…" : "إرسال التعليق"}</button>
    </form>
  );
}
