"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { toActionError, type ActionState } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { authorSchema, fieldErrors, settingsSchema } from "@/lib/validation";

export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertPermission("settings:manage");
    const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const { social_x, social_facebook, social_instagram, social_youtube, social_telegram, social_linkedin, privacyPolicy, termsOfUse, ...rest } = parsed.data;
    const socialLinks = Object.fromEntries(
      Object.entries({ x: social_x, facebook: social_facebook, instagram: social_instagram, youtube: social_youtube, telegram: social_telegram, linkedin: social_linkedin }).filter(([, v]) => !!v),
    );
    const data = {
      ...rest,
      socialLinks,
      privacyPolicy: privacyPolicy ? sanitizeArticleHtml(privacyPolicy) || null : null,
      termsOfUse: termsOfUse ? sanitizeArticleHtml(termsOfUse) || null : null,
    };
    await prisma.siteSettings.upsert({ where: { id: "site" }, update: data, create: { id: "site", ...data } });
    revalidatePath("/", "layout");
    return { ok: true, message: "تم حفظ الإعدادات" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function saveAuthorAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertPermission("author:manage");
    const parsed = authorSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
    const data = { ...parsed.data, authorBio: parsed.data.authorBio ? sanitizeArticleHtml(parsed.data.authorBio) || null : null };
    await prisma.siteSettings.upsert({ where: { id: "site" }, update: data, create: { id: "site", ...data } });
    revalidatePath("/", "layout");
    return { ok: true, message: "تم حفظ بيانات الكاتب" };
  } catch (err) {
    return toActionError(err);
  }
}
