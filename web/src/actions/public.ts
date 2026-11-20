"use server";

import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashValue } from "@/lib/security";
import { getSettings } from "@/lib/settings";
import { publicWhere } from "@/lib/articles";
import { commentSchema, contactSchema, fieldErrors, newsletterSchema } from "@/lib/validation";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

const TOO_MANY = "عدد كبير من المحاولات. يرجى المحاولة لاحقاً.";

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "تحقق من البريد الإلكتروني" };
  const settings = await getSettings();
  if (!settings.newsletterEnabled) return { ok: false, message: "النشرة البريدية غير متاحة حالياً" };
  const ip = hashValue(await clientIp());
  if (!(await rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000))) return { ok: false, message: TOO_MANY };
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { unsubscribedAt: null },
    create: { email: parsed.data.email },
  });
  return { ok: true, message: "تم الاشتراك بنجاح. شكراً لك." };
}

export async function submitComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "يرجى تصحيح الحقول" };
  const settings = await getSettings();
  if (!settings.commentsEnabled) return { ok: false, message: "التعليقات مغلقة حالياً" };
  const article = await prisma.article.findFirst({ where: publicWhere({ id: parsed.data.articleId }), select: { id: true } });
  if (!article) return { ok: false, message: "المقال غير متاح" };
  const ip = hashValue(await clientIp());
  if (!(await rateLimit(`comment:${ip}`, 5, 10 * 60 * 1000))) return { ok: false, message: TOO_MANY };
  await prisma.comment.create({
    data: {
      articleId: article.id,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      content: parsed.data.content,
      ipHash: ip,
    },
  });
  return { ok: true, message: "شكراً لك. سيظهر تعليقك بعد مراجعته." };
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "يرجى تصحيح الحقول" };
  const ip = hashValue(await clientIp());
  if (!(await rateLimit(`contact:${ip}`, 3, 60 * 60 * 1000))) return { ok: false, message: TOO_MANY };
  const { website: _hp, ...data } = parsed.data;
  await prisma.contactMessage.create({ data: { ...data, ipHash: ip } });
  return { ok: true, message: "تم استلام رسالتك بنجاح، وسيتم الرد عليك في أقرب وقت." };
}
