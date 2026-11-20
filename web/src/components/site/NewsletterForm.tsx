"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type FormState } from "@/actions/public";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, {});
  return (
    <form action={action} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`nl-email-${variant}`} className="sr-only">البريد الإلكتروني</label>
        <input
          id={`nl-email-${variant}`}
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder="name@example.com"
          className={`input text-left ${variant === "dark" ? "border-navy-700 bg-navy-800 text-white placeholder:text-navy-100/50" : ""}`}
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button type="submit" className="btn-gold shrink-0" disabled={pending}>
          {pending ? "جارٍ الإرسال…" : "اشترك"}
        </button>
      </div>
      {state.message && (
        <p role="status" className={`text-sm ${state.ok ? (variant === "dark" ? "text-gold-300" : "text-green-700") : "text-red-500"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
