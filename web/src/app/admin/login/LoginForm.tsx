"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label htmlFor="email" className="label">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" autoComplete="username" dir="ltr" required className="input text-left" />
      </div>
      <div>
        <label htmlFor="password" className="label">كلمة المرور</label>
        <input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required className="input text-left" />
      </div>
      {state.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
        {pending ? "جارٍ التحقق…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
