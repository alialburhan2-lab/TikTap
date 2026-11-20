/**
 * بيانات البداية.
 * - ينشئ حساب المالك من متغيرات البيئة ADMIN_EMAIL / ADMIN_PASSWORD (إن لم يكن موجوداً).
 * - ينشئ التصنيفات الأساسية وإعدادات الموقع.
 * - إذا كانت SEED_DEMO=true ينشئ مقالات تجريبية مُعلّمة بوضوح (isDemo = true) دون نسبة أي آراء
 *   أو سيرة ذاتية أو مناصب إلى غسان البرهان.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "مقالات سياسية", slug: "politics", description: "قراءات في الشأن السياسي المحلي والإقليمي والدولي.", sortOrder: 1 },
  { name: "تحليلات", slug: "analysis", description: "تحليلات معمّقة للأحداث والقضايا الراهنة.", sortOrder: 2 },
  { name: "حوارات", slug: "interviews", description: "حوارات ولقاءات صحفية.", sortOrder: 3 },
  { name: "دراسات", slug: "studies", description: "دراسات وأوراق بحثية.", sortOrder: 4 },
  { name: "رأي", slug: "opinion", description: "مقالات الرأي ووجهات النظر.", sortOrder: 5 },
];

const DEMO_PARAGRAPHS = [
  "هذا نص تجريبي يُستخدم لعرض شكل المقال على المنصة واختبار تنسيق الفقرات والعناوين والاقتباسات. لا يمثل هذا النص رأياً حقيقياً ولا ينسب إلى أي كاتب.",
  "يهدف هذا المحتوى إلى إظهار تجربة القراءة على الهاتف والجهاز اللوحي والحاسوب، مع مسافات مريحة بين الأسطر وخط واضح يناسب النصوص الطويلة.",
  "يمكن للمدير حذف هذه المقالات التجريبية أو تعديلها بالكامل من لوحة الإدارة، ثم البدء بنشر المقالات الحقيقية دون الحاجة إلى أي تعديل برمجي.",
];

function demoContent(title: string): string {
  return [
    `<p><strong>[محتوى تجريبي]</strong> ${DEMO_PARAGRAPHS[0]}</p>`,
    `<h2>عنوان فرعي تجريبي</h2>`,
    `<p>${DEMO_PARAGRAPHS[1]}</p>`,
    `<blockquote><p>اقتباس تجريبي لعرض تنسيق الاقتباسات داخل «${title}».</p></blockquote>`,
    `<ul><li>نقطة تجريبية أولى.</li><li>نقطة تجريبية ثانية.</li><li>نقطة تجريبية ثالثة.</li></ul>`,
    `<h3>خاتمة تجريبية</h3>`,
    `<p>${DEMO_PARAGRAPHS[2]}</p>`,
  ].join("\n");
}

const DEMO_TITLES: [string, string][] = [
  ["politics", "مقال سياسي تجريبي: نموذج لعرض المقالات السياسية"],
  ["analysis", "تحليل تجريبي: نموذج لعرض التحليلات المطوّلة"],
  ["interviews", "حوار تجريبي: نموذج لعرض الحوارات الصحفية"],
  ["studies", "دراسة تجريبية: نموذج لعرض الدراسات والأبحاث"],
  ["opinion", "مقال رأي تجريبي: نموذج لعرض مقالات الرأي"],
  ["politics", "مقال سياسي تجريبي ثانٍ لاختبار الترقيم والأرشيف"],
  ["analysis", "تحليل تجريبي ثانٍ لاختبار البحث والتصفية"],
  ["opinion", "مقال رأي تجريبي ثانٍ لاختبار الأكثر قراءة"],
  ["studies", "دراسة تجريبية ثانية لاختبار الأرشيف الشهري"],
];

/** يولّد صورة غلاف تجريدية بهوية المنصة (بدون محتوى حقيقي) */
async function makeCover(index: number): Promise<string> {
  const hue = [0, 1, 2, 3, 4][index % 5];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#172A38"/><stop offset="1" stop-color="${["#2E4C62", "#213A4C", "#0D1A24", "#2E4C62", "#213A4C"][hue]}"/>
    </linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <circle cx="${300 + index * 120}" cy="${200 + (index % 3) * 150}" r="${260 + index * 15}" fill="none" stroke="#D8B77A" stroke-opacity="0.35" stroke-width="3"/>
    <circle cx="${1200 - index * 60}" cy="${650 - (index % 2) * 120}" r="${180 + index * 10}" fill="#D8B77A" fill-opacity="0.12"/>
    <rect x="120" y="700" width="420" height="8" fill="#D8B77A"/>
    <text x="1480" y="820" font-family="sans-serif" font-size="44" fill="#EAD6AE" text-anchor="end" opacity="0.7">DEMO</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
  const d = new Date();
  const key = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/demo-${randomBytes(6).toString("hex")}.webp`;
  const root = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
  const full = path.join(root, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

async function main() {
  // الإعدادات
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      authorImage: "/images/author/portrait.webp",
      heroImage: "/images/author/hero-books.webp",
      authorShortBio: "نص تجريبي — يُرجى إضافة النبذة الحقيقية من لوحة الإدارة ← بيانات الكاتب.",
      authorBio: "<p><strong>نص تجريبي:</strong> لم تُضف السيرة الذاتية بعد. يمكن تحرير هذا القسم بالكامل من لوحة الإدارة ← بيانات الكاتب.</p>",
    },
  });

  // المالك
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  let owner = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!owner) {
    if (!email || password.length < 10) {
      throw new Error("يجب ضبط ADMIN_EMAIL و ADMIN_PASSWORD (10 أحرف على الأقل) في ملف .env قبل تشغيل seed");
    }
    owner = await prisma.user.create({
      data: { email, name: process.env.ADMIN_NAME || "غسان البرهان", role: "OWNER", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`✔ تم إنشاء حساب المالك: ${email}`);
  } else {
    console.log(`• حساب المالك موجود: ${email}`);
  }

  // التصنيفات
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  console.log(`✔ التصنيفات: ${CATEGORIES.length}`);

  if (process.env.SEED_DEMO !== "true") return;

  // مستخدمون تجريبيون لاختبار الصلاحيات
  const demoPass = await bcrypt.hash("Demo#Pass2026", 12);
  for (const u of [
    { email: "editor@demo.local", name: "محرر تجريبي", role: "EDITOR" as const },
    { email: "author@demo.local", name: "كاتب تجريبي", role: "AUTHOR" as const },
  ]) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash: demoPass } });
  }

  const existingDemo = await prisma.article.count({ where: { isDemo: true } });
  if (existingDemo > 0) {
    console.log("• المقالات التجريبية موجودة مسبقاً");
    return;
  }

  const cats = await prisma.category.findMany();
  const tag = await prisma.tag.upsert({ where: { slug: "تجريبي" }, update: {}, create: { name: "تجريبي", slug: "تجريبي" } });
  const now = Date.now();
  for (let i = 0; i < DEMO_TITLES.length; i++) {
    const [catSlug, title] = DEMO_TITLES[i];
    const key = await makeCover(i);
    const media = await prisma.media.create({
      data: {
        url: `/uploads/${key}`,
        storageKey: key,
        driver: "local",
        filename: `demo-cover-${i + 1}.webp`,
        mimeType: "image/webp",
        size: 0,
        width: 1600,
        height: 900,
        alt: "صورة غلاف تجريبية",
        uploadedById: owner.id,
      },
    });
    const content = demoContent(title);
    const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    await prisma.article.create({
      data: {
        title,
        slug: `demo-article-${i + 1}`,
        subtitle: "عنوان فرعي تجريبي لأغراض العرض",
        excerpt: "ملخص تجريبي لعرض شكل بطاقة المقال في الصفحة الرئيسية وصفحات الأقسام.",
        content,
        contentText: text,
        coverImage: media.url,
        coverImageAlt: "صورة غلاف تجريبية",
        status: "PUBLISHED",
        featured: i === 0,
        isDemo: true,
        publishedAt: new Date(now - i * 9 * 86_400_000),
        views: Math.max(0, 40 - i * 4),
        readingMinutes: 2,
        authorId: owner.id,
        categoryId: cats.find((c) => c.slug === catSlug)?.id,
        tags: { create: [{ tagId: tag.id }] },
      },
    });
  }
  // مسودة تجريبية
  await prisma.article.create({
    data: {
      title: "مسودة تجريبية غير منشورة",
      slug: "demo-draft",
      content: "<p>[محتوى تجريبي] هذه مسودة لا تظهر للزوار.</p>",
      contentText: "[محتوى تجريبي] هذه مسودة لا تظهر للزوار.",
      status: "DRAFT",
      isDemo: true,
      authorId: owner.id,
    },
  });
  console.log(`✔ مقالات تجريبية: ${DEMO_TITLES.length + 1} (مُعلّمة كمحتوى تجريبي)`);
  console.log("✔ مستخدمون تجريبيون: editor@demo.local / author@demo.local — كلمة المرور: Demo#Pass2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
