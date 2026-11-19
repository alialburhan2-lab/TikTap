"use client";

import { useActionState } from "react";
import { loginAction, type AdminFormState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block"><span className="label">Email</span><input name="email" type="email" required autoComplete="username" className="input" /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" required autoComplete="current-password" className="input" /></label>
      {state.message && <p role="alert" className="text-sm text-rose-700">{state.message}</p>}
      <button className="btn-river w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
