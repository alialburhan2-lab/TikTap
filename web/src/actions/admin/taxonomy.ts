"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { toActionError, type ActionState } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { categorySchema, fieldErrors, tagSchema } from "@/lib/validation";

export async function saveCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertPermission("category:manage");
    const id = String(fd.get("id") || "") || undefined;
    const parsed = categorySchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const { slug, ...rest } = parsed.data;
    const finalSlug = slug ?? slugify(rest.name, 80);
    if (!finalSlug) throw new ValidationError({ slug: "تعذّر توليد Slug، أدخله يدوياً" });
    if (id) await prisma.category.update({ where: { id }, data: { ...rest, slug: finalSlug } });
    else await prisma.category.create({ data: { ...rest, slug: finalSlug } });
    revalidatePath("/", "layout");
    return { ok: true, message: id ? "تم تحديث التصنيف" : "تمت إضافة التصنيف", stamp: Date.now() };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteCategoryAction(fd: FormData) {
  let msg = "تم حذف التصنيف";
  try {
    await assertPermission("category:manage");
    await prisma.category.delete({ where: { id: String(fd.get("id")) } });
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  redirect(`/admin/categories?msg=${encodeURIComponent(msg)}`);
}

export async function saveTagAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertPermission("tag:manage");
    const id = String(fd.get("id") || "") || undefined;
    const parsed = tagSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const slug = parsed.data.slug ?? slugify(parsed.data.name, 60);
    if (!slug) throw new ValidationError({ slug: "تعذّر توليد Slug" });
    if (id) await prisma.tag.update({ where: { id }, data: { name: parsed.data.name, slug } });
    else await prisma.tag.create({ data: { name: parsed.data.name, slug } });
    revalidatePath("/", "layout");
    return { ok: true, message: id ? "تم تحديث الوسم" : "تمت إضافة الوسم", stamp: Date.now() };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteTagAction(fd: FormData) {
  let msg = "تم حذف الوسم";
  try {
    await assertPermission("tag:manage");
    await prisma.tag.delete({ where: { id: String(fd.get("id")) } });
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  redirect(`/admin/tags?msg=${encodeURIComponent(msg)}`);
}
