"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-result";

export function SubmitButton({ children, className = "btn-primary", pendingText = "جارٍ الحفظ…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`rounded-md p-3 text-sm ${state.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
      {state.message}
    </p>
  );
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state.errors?.[name];
  return msg ? <p className="field-error">{msg}</p> : null;
}

/**
 * زر حذف/إجراء خطير مع نافذة تأكيد.
 * يستدعي Server Action مع الحقول المخفية المحددة.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title = "تأكيد الإجراء",
  message,
  confirmLabel = "تأكيد الحذف",
  className = "btn-outline px-3 py-1.5 text-xs text-red-700",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: React.ReactNode;
  title?: string;
  message: string;
  confirmLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,28rem)] rounded-lg p-0 backdrop:bg-navy-950/60">
        <form action={action} className="space-y-4 p-6" onSubmit={() => setTimeout(() => ref.current?.close(), 0)}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 className="text-lg font-extrabold text-navy-900">{title}</h2>
          <p className="text-sm leading-7 text-muted">{message}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => ref.current?.close()}>إلغاء</button>
            <SubmitButton className="btn-danger" pendingText="جارٍ التنفيذ…">{confirmLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** رسالة مؤقتة تختفي تلقائياً */
export function Flash({ text }: { text?: string }) {
  const [show, setShow] = useState(!!text);
  useEffect(() => {
    if (!text) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(id);
  }, [text]);
  if (!show || !text) return null;
  return <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{text}</p>;
}
