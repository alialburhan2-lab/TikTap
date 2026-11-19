"use client";

import { useActionState } from "react";
import { createUserAction, type AdminFormState } from "@/app/admin/actions";
import { ROLES } from "@/data/types";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(createUserAction, {});
  return (
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-4">
      <input name="email" type="email" required placeholder="email" className="input" />
      <input name="displayName" required placeholder="Display name" className="input" />
      <select name="role" className="input" defaultValue="editor">{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      <input name="password" type="password" required minLength={12} placeholder="Password (≥12 chars)" className="input" autoComplete="new-password" />
      <div className="flex items-center gap-3 md:col-span-4">
        <button className="btn-river" disabled={pending}>Create user</button>
        {state.message && <span className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
