import { z } from "zod";
import { isValidSlug } from "./slug";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || v.startsWith("/uploads/") || v.startsWith("/images/") || /^https:\/\//.test(v), {
    message: "رابط الصورة غير صالح",
  });

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

export const articleStatusEnum = z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);

export const articleSchema = z
  .object({
    title: trimmed(250).min(3, "العنوان قصير جداً"),
    slug: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || isValidSlug(v), { message: "الرابط (Slug) يجب أن يحتوي على حروف وأرقام وشرطات فقط" }),
    subtitle: optionalText(300),
    excerpt: optionalText(600),
    content: z.string().max(500_000, "المحتوى طويل جداً").default(""),
    coverImage: imageUrl,
    coverImageAlt: optionalText(250),
    categoryId: optionalText(40),
    tags: z
      .string()
      .max(1000)
      .optional()
      .transform((v) =>
        Array.from(
          new Set(
            (v || "")
              .split(/[,،]/)
              .map((t) => t.trim())
              .filter((t) => t.length > 0 && t.length <= 50),
          ),
        ).slice(0, 15),
      ),
    status: articleStatusEnum.default("DRAFT"),
    publishedAt: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({ code: "custom", message: "تاريخ النشر غير صالح" });
          return z.NEVER;
        }
        return d;
      }),
    featured: checkbox,
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .superRefine((data, ctx) => {
    if (data.status === "SCHEDULED") {
      if (!data.publishedAt) {
        ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "حدد موعد النشر للمقال المجدول" });
      } else if (data.publishedAt.getTime() <= Date.now()) {
        ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "موعد الجدولة يجب أن يكون في المستقبل" });
      }
    }
  });

export type ArticleInput = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  name: trimmed(80).min(2, "اسم التصنيف قصير"),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidSlug(v), { message: "Slug غير صالح" }),
  description: optionalText(300),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  showInNav: checkbox,
});

export const tagSchema = z.object({
  name: trimmed(50).min(1, "اسم الوسم مطلوب"),
  slug: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidSlug(v), { message: "Slug غير صالح" }),
});

export const passwordSchema = z
  .string()
  .min(10, "كلمة المرور يجب ألا تقل عن 10 أحرف")
  .max(128)
  .refine((v) => /[A-Za-z؀-ۿ]/.test(v) && /\d/.test(v), {
    message: "كلمة المرور يجب أن تحتوي على حروف وأرقام",
  });

export const roleEnum = z.enum(["OWNER", "EDITOR", "AUTHOR"]);

export const userCreateSchema = z.object({
  name: trimmed(100).min(2, "الاسم مطلوب"),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(200),
  role: roleEnum,
  password: passwordSchema,
});

export const userUpdateSchema = z.object({
  name: trimmed(100).min(2, "الاسم مطلوب"),
  role: roleEnum,
  active: checkbox,
  password: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(passwordSchema.nullable()),
});

export const profileSchema = z.object({
  name: trimmed(100).min(2, "الاسم مطلوب"),
  bio: optionalText(1000),
  avatarUrl: imageUrl,
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(passwordSchema.nullable()),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(128),
});

export const commentSchema = z.object({
  articleId: z.string().min(1).max(40),
  authorName: trimmed(80).min(2, "الاسم مطلوب"),
  authorEmail: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(200),
  content: trimmed(3000).min(3, "التعليق قصير جداً"),
  website: z.string().max(0, "spam").optional(), // honeypot
});

export const contactSchema = z.object({
  name: trimmed(100).min(2, "الاسم مطلوب"),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(200),
  subject: trimmed(200).min(2, "الموضوع مطلوب"),
  message: trimmed(5000).min(10, "الرسالة قصيرة جداً"),
  website: z.string().max(0, "spam").optional(),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(200),
  website: z.string().max(0, "spam").optional(),
});

const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\//.test(v), { message: "يجب أن يبدأ الرابط بـ https://" });

export const settingsSchema = z.object({
  siteName: trimmed(100).min(2),
  siteTagline: trimmed(200),
  siteDescription: trimmed(400),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, { message: "بريد غير صالح" }),
  footerText: optionalText(400),
  postsPerPage: z.coerce.number().int().min(3).max(48),
  commentsEnabled: checkbox,
  newsletterEnabled: checkbox,
  social_x: urlOrEmpty,
  social_facebook: urlOrEmpty,
  social_instagram: urlOrEmpty,
  social_youtube: urlOrEmpty,
  social_telegram: urlOrEmpty,
  social_linkedin: urlOrEmpty,
  heroImage: imageUrl,
  privacyPolicy: z.string().max(100_000).optional(),
  termsOfUse: z.string().max(100_000).optional(),
});

export const authorSchema = z.object({
  authorName: trimmed(100).min(2),
  authorTitle: optionalText(200),
  authorShortBio: optionalText(600),
  authorBio: z.string().max(100_000).optional(),
  authorImage: imageUrl,
});

/** تحويل أخطاء zod إلى كائن حقل => رسالة */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
