"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { toActionError, type ActionState } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { removeMedia } from "@/lib/services/media";

export async function updateMediaAltAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await assertPermission("media:upload");
    const id = String(fd.get("id") || "");
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return { ok: false, message: "الصورة غير موجودة" };
    if (!can(user.role, "media:manage") && media.uploadedById !== user.id) throw new ForbiddenError();
    const alt = String(fd.get("alt") || "").trim().slice(0, 250) || null;
    await prisma.media.update({ where: { id }, data: { alt } });
    revalidatePath("/admin/media");
    return { ok: true, message: "تم حفظ النص البديل" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteMediaAction(fd: FormData) {
  let msg = "تم حذف الصورة";
  try {
    const user = await assertPermission("media:upload");
    const id = String(fd.get("id") || "");
    const media = await prisma.media.findUnique({ where: { id } });
    if (media && !can(user.role, "media:manage") && media.uploadedById !== user.id) throw new ForbiddenError();
    await removeMedia(id);
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  redirect(`/admin/media?msg=${encodeURIComponent(msg)}`);
}
