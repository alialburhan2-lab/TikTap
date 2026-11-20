"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission, getCurrentUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { toActionError, type ActionState } from "@/lib/action-result";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { fieldErrors, profileSchema, userCreateSchema, userUpdateSchema } from "@/lib/validation";

export async function createUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertPermission("user:manage");
    const parsed = userCreateSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const { password, ...data } = parsed.data;
    await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) } });
    revalidatePath("/admin/users");
    return { ok: true, message: "تم إنشاء المستخدم", stamp: Date.now() };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("user:manage");
    const id = String(fd.get("id") || "");
    const parsed = userUpdateSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return { ok: false, message: "المستخدم غير موجود" };
    const { password, ...data } = parsed.data;

    // حماية من فقدان آخر مالك أو تعطيل/تخفيض الحساب الحالي
    if (target.id === actor.id && (data.role !== "OWNER" || !data.active)) {
      throw new ForbiddenError("لا يمكنك تخفيض صلاحياتك أو تعطيل حسابك بنفسك");
    }
    if (target.role === "OWNER" && (data.role !== "OWNER" || !data.active)) {
      const owners = await prisma.user.count({ where: { role: "OWNER", active: true } });
      if (owners <= 1) throw new ForbiddenError("يجب أن يبقى مالك واحد نشط على الأقل");
    }
    await prisma.user.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "تم تحديث المستخدم" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteUserAction(fd: FormData) {
  let msg = "تم حذف المستخدم";
  try {
    const actor = await assertPermission("user:manage");
    const id = String(fd.get("id") || "");
    if (id === actor.id) throw new ForbiddenError("لا يمكنك حذف حسابك");
    const target = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
    if (!target) throw new ValidationError({}, "المستخدم غير موجود");
    if (target._count.articles > 0) {
      throw new ValidationError({}, "لا يمكن حذف مستخدم لديه مقالات. يمكنك تعطيل حسابه بدلاً من ذلك.");
    }
    if (target.role === "OWNER") {
      const owners = await prisma.user.count({ where: { role: "OWNER", active: true } });
      if (owners <= 1) throw new ForbiddenError("يجب أن يبقى مالك واحد نشط على الأقل");
    }
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  redirect(`/admin/users?msg=${encodeURIComponent(msg)}`);
}

/** تحديث الملف الشخصي للمستخدم الحالي (أي دور) — لا يسمح بتغيير الدور */
export async function updateProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const me = await getCurrentUser();
    if (!me) throw new ForbiddenError("يجب تسجيل الدخول");
    const parsed = profileSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const { currentPassword, newPassword, ...data } = parsed.data;
    let passwordHash: string | undefined;
    if (newPassword) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        throw new ValidationError({ currentPassword: "كلمة المرور الحالية غير صحيحة" });
      }
      passwordHash = await bcrypt.hash(newPassword, 12);
    }
    await prisma.user.update({ where: { id: me.id }, data: { ...data, ...(passwordHash ? { passwordHash } : {}) } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "تم حفظ الملف الشخصي" };
  } catch (err) {
    return toActionError(err);
  }
}
