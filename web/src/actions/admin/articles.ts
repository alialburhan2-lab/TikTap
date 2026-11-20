"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ArticleStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-guard";
import { isRedirectError, toActionError, type ActionState } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/errors";
import { deleteArticle, saveArticle, setArticleStatus } from "@/lib/services/articles";

async function actor() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("انتهت الجلسة. يرجى تسجيل الدخول مجدداً.");
  return { id: user.id, role: user.role };
}

export async function saveArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") || "") || undefined;
  const raw = Object.fromEntries(formData);
  let savedId: string;
  try {
    const article = await saveArticle(await actor(), raw, id);
    savedId = article.id;
    revalidatePath("/", "layout");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return toActionError(err);
  }
  if (!id) redirect(`/admin/articles/${savedId}?created=1`);
  return { ok: true, message: "تم حفظ المقال بنجاح", stamp: Date.now() };
}

export async function deleteArticleAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  let msg = "تم حذف المقال";
  try {
    await deleteArticle(await actor(), id);
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  redirect(`/admin/articles?msg=${encodeURIComponent(msg)}`);
}

export async function setArticleStatusAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ArticleStatus;
  const back = String(formData.get("back") || "/admin/articles");
  let msg = "تم تحديث حالة المقال";
  try {
    await setArticleStatus(await actor(), id, status);
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر التحديث";
  }
  const sep = back.includes("?") ? "&" : "?";
  redirect(`${back.startsWith("/admin") ? back : "/admin/articles"}${sep}msg=${encodeURIComponent(msg)}`);
}
