import { ForbiddenError, NotFoundError, ValidationError } from "./errors";

export interface ActionState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** يتغير مع كل نجاح لإعادة تهيئة النماذج */
  stamp?: number;
}

/** يحوّل الأخطاء المعروفة إلى رسالة للمستخدم دون تسريب تفاصيل داخلية */
export function toActionError(err: unknown): ActionState {
  if (err instanceof ValidationError) return { ok: false, message: err.message, errors: err.fields };
  if (err instanceof ForbiddenError || err instanceof NotFoundError) return { ok: false, message: err.message };
  // أخطاء Prisma الشائعة
  const code = (err as { code?: string })?.code;
  if (code === "P2002") return { ok: false, message: "القيمة مستخدمة مسبقاً (مكررة)" };
  if (code === "P2003") return { ok: false, message: "لا يمكن الحذف لارتباط العنصر ببيانات أخرى" };
  if (code === "P2025") return { ok: false, message: "العنصر غير موجود" };
  console.error("[action]", err);
  return { ok: false, message: "حدث خطأ غير متوقع. حاول مرة أخرى." };
}

/** هل الخطأ إعادة توجيه من Next (يجب إعادة رميه) */
export function isRedirectError(err: unknown): boolean {
  const digest = (err as { digest?: string })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND");
}
