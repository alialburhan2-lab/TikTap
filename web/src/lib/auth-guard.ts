import "server-only";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "./db";
import { can, type Permission } from "./permissions";
import { ForbiddenError } from "./errors";

export { ForbiddenError };

export type CurrentUser = Pick<User, "id" | "name" | "email" | "role" | "avatarUrl" | "bio">;

/**
 * يجلب المستخدم الحالي من قاعدة البيانات (وليس من الرمز فقط) كي تُطبق
 * تغييرات الأدوار أو التعطيل فوراً.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, bio: true, active: true },
  });
  if (!user || !user.active) return null;
  const { active: _active, ...rest } = user;
  return rest;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}


/** للاستخدام داخل Server Actions: يرمي خطأ بدلاً من إعادة التوجيه */
export async function assertPermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("يجب تسجيل الدخول");
  if (!can(user.role, permission)) throw new ForbiddenError();
  return user;
}

export function hasRole(user: { role: Role }, ...roles: Role[]) {
  return roles.includes(user.role);
}
