"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useTransition } from "react";
import type { ActionState } from "@/lib/action-result";
import { FormMessage } from "./ui";

const StateCtx = createContext<ActionState>({});

/** يعرض خطأ الحقل من حالة أقرب ActionForm */
export function Err({ name }: { name: string }) {
  const state = useContext(StateCtx);
  const msg = state.errors?.[name];
  return msg ? <p className="field-error">{msg}</p> : null;
}

/**
 * نموذج عام مرتبط بـ Server Action مع عرض الرسائل.
 * resetOnSuccess: لتفريغ الحقول بعد الإضافة الناجحة.
 */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
  submitLabel = "حفظ",
  submitClassName = "btn-primary",
  testId,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  submitLabel?: string;
  submitClassName?: string;
  testId?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <StateCtx.Provider value={state}>
      <form
        ref={ref}
        data-testid={testId}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
      >
        <FormMessage state={state} />
        {children}
        <div>
          <button type="submit" className={submitClassName} disabled={pending}>
            {pending ? "جارٍ الحفظ…" : submitLabel}
          </button>
        </div>
      </form>
    </StateCtx.Provider>
  );
}
