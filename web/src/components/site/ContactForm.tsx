"use client";

import { useActionState } from "react";
import { submitContact, type FormState } from "@/actions/public";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {});
  if (state.ok) return <p role="status" className="card bg-green-50 p-6 text-green-800">{state.message}</p>;
  return (
    <form action={action} className="card space-y-5 p-6" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="label">الاسم</label>
          <input id="ct-name" name="name" className="input" required maxLength={100} />
          {state.errors?.name && <p className="field-error">{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor="ct-email" className="label">البريد الإلكتروني</label>
          <input id="ct-email" name="email" type="email" dir="ltr" className="input text-left" required maxLength={200} />
          {state.errors?.email && <p className="field-error">{state.errors.email}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ct-subject" className="label">الموضوع</label>
        <input id="ct-subject" name="subject" className="input" required maxLength={200} />
        {state.errors?.subject && <p className="field-error">{state.errors.subject}</p>}
      </div>
      <div>
        <label htmlFor="ct-message" className="label">الرسالة</label>
        <textarea id="ct-message" name="message" rows={7} className="input" required maxLength={5000} />
        {state.errors?.message && <p className="field-error">{state.errors.message}</p>}
      </div>
      {state.message && !state.ok && <p role="alert" className="field-error">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "جارٍ الإرسال…" : "إرسال الرسالة"}</button>
    </form>
  );
}
