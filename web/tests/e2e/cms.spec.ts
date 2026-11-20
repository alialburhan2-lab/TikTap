import path from "path";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { AUTHOR, login, OWNER } from "./helpers";

const TITLE = "مقال اختبار شامل للنشر";

test.describe.serial("article lifecycle", () => {
  test("owner creates, uploads cover, publishes, edits", async ({ page }) => {
    await login(page, OWNER);
    await page.goto("/admin/articles/new");
    await page.getByLabel("العنوان *").fill(TITLE);
    await page.getByLabel("العنوان الفرعي").fill("عنوان فرعي للاختبار");
    const editor = page.getByTestId("rich-editor");
    await editor.click();
    await page.keyboard.type("فقرة اختبارية تحتوي كلمة فريدة بنفسجية.");
    await page.getByRole("button", { name: "عنوان رئيسي" }).click();
    await page.getByLabel("التصنيف").selectOption({ label: "تحليلات" });
    await page.getByLabel("الوسوم").fill("اختبار، جودة");

    const png = await sharp({ create: { width: 1200, height: 700, channels: 3, background: "#D8B77A" } }).png().toBuffer();
    await page.getByTestId("upload-coverImage").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
    await expect(page.locator('input[name="coverImage"]')).toHaveValue(/^\/uploads\/.+\.webp$/);
    await page.getByLabel("النص البديل (Alt Text)").fill("غلاف الاختبار");

    await page.getByLabel("الحالة").selectOption("PUBLISHED");
    await page.getByRole("button", { name: "حفظ المقال" }).click();
    await expect(page).toHaveURL(/\/admin\/articles\/[a-z0-9]+\?created=1/);
    await expect(page.getByText("تم إنشاء المقال بنجاح")).toBeVisible();

    await page.getByLabel("العنوان *").fill(TITLE + " معدّل");
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await expect(page.getByText("تم حفظ المقال بنجاح")).toBeVisible();
  });

  test("published article is public, searchable, and has SEO tags", async ({ page }) => {
    await page.goto("/articles");
    await page.getByRole("link", { name: TITLE + " معدّل" }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE + " معدّل");
    await expect(page.locator(".article-body h2")).toContainText("بنفسجية");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /مقال اختبار/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/article\//);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole("img", { name: "غلاف الاختبار" })).toBeVisible();

    await page.goto("/search?q=" + encodeURIComponent("بنفسجية"));
    await expect(page.getByTestId("search-count")).toContainText("1");
    await page.goto("/category/analysis");
    await expect(page.getByText(TITLE + " معدّل")).toBeVisible();
    await page.goto("/sitemap.xml");
    expect(await page.content()).toContain("/article/");
  });

  test("article is readable on mobile", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto("/search?q=" + encodeURIComponent("بنفسجية"));
    const href = await page.locator("main h3 a").first().getAttribute("href");
    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE + " معدّل");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    await page.getByRole("button", { name: "فتح القائمة" }).click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await ctx.close();
  });

  test("owner archives then deletes with confirmation", async ({ page }) => {
    await login(page, OWNER);
    await page.goto("/admin/articles?q=" + encodeURIComponent("مقال اختبار شامل"));
    const row = page.getByTestId("article-row").first();
    await row.getByRole("button", { name: "أرشفة" }).click();
    await expect(page.getByText("تم تحديث حالة المقال")).toBeVisible();
    await page.getByTestId("article-row").first().getByRole("button", { name: "حذف" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "تأكيد الحذف" }).click();
    await expect(page.getByText("تم حذف المقال")).toBeVisible();
    await expect(page.getByTestId("article-row").filter({ hasText: "مقال اختبار شامل" })).toHaveCount(0);
  });
});

test("author writes a draft and submits for review; it stays private", async ({ page }) => {
  await login(page, AUTHOR);
  await page.goto("/admin/articles/new");
  await page.getByLabel("العنوان *").fill("مقال الكاتب للمراجعة");
  await page.getByLabel("الحالة").selectOption("REVIEW");
  await page.getByRole("button", { name: "حفظ المقال" }).click();
  await expect(page.getByText("تم إنشاء المقال بنجاح")).toBeVisible();
  await page.goto("/search?q=" + encodeURIComponent("مقال الكاتب للمراجعة"));
  await expect(page.getByTestId("search-count")).toContainText("0");
});

test("validation errors are shown", async ({ page }) => {
  await login(page, OWNER);
  await page.goto("/admin/articles/new");
  await page.getByLabel("العنوان *").fill("ab");
  await page.getByRole("button", { name: "حفظ المقال" }).click();
  await expect(page.getByText("العنوان قصير جداً")).toBeVisible();
});

test("categories: create one and see it in public navigation", async ({ page }) => {
  await login(page, OWNER);
  await page.goto("/admin/categories");
  const form = page.getByTestId("category-create");
  await form.locator('input[name="name"]').fill("ثقافة");
  await form.locator('input[name="slug"]').fill("culture");
  await form.getByRole("button", { name: "إضافة" }).click();
  await expect(page.getByText("تمت إضافة التصنيف")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "القائمة الرئيسية" }).getByRole("link", { name: "ثقافة" })).toBeVisible();
  await page.goto("/category/culture");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ثقافة");
});

test("media library upload rejects invalid files and accepts images", async ({ page }) => {
  await login(page, OWNER);
  await page.goto("/admin/media");
  const before = await page.getByTestId("media-item").count();
  await page.getByTestId("media-file").setInputFiles({ name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
  await page.getByRole("button", { name: "رفع", exact: true }).click();
  await expect(page.getByText("الملف ليس صورة صالحة")).toBeVisible();
  const jpg = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#172A38" } }).jpeg().toBuffer();
  await page.getByTestId("media-file").setInputFiles({ name: "ok.jpg", mimeType: "image/jpeg", buffer: jpg });
  await page.getByRole("button", { name: "رفع", exact: true }).click();
  await expect(page.getByText("تم رفع الصورة بنجاح")).toBeVisible();
  await expect(page.getByTestId("media-item")).toHaveCount(before + 1);
  void path;
});
