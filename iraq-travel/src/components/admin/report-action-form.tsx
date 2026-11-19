"use client";

import { useActionState } from "react";
import { updateReportAction, type AdminFormState } from "@/app/admin/actions";

export function ReportActionForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(updateReportAction.bind(null, id), {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
      <label className="text-xs"><span className="label">Status</span>
        <select name="status" defaultValue={status} className="input">{["new", "under_review", "action_taken", "dismissed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></label>
      <label className="min-w-64 flex-1 text-xs"><span className="label">Action taken / note</span><input name="note" required minLength={3} className="input" /></label>
      <button className="btn-river" disabled={pending}>Log action</button>
      {state.message && <span className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</span>}
    </form>
  );
}
