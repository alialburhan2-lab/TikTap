import { expect, test } from "@playwright/test";
import { login, OWNER } from "./helpers";

test("homepage sections render with demo labels", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("الكلمة موقف");
  await expect(page.getByRole("heading", { name: "الأكثر قراءة", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "عن الكاتب" }).or(page.getByText("عن الكاتب").first())).toBeVisible();
  await expect(page.getByText("محتوى تجريبي").first()).toBeVisible();
});

test("all public pages respond", async ({ page }) => {
  for (const p of ["/articles", "/category/politics", "/category/analysis", "/category/interviews", "/category/studies", "/category/opinion", "/archive", "/about", "/contact", "/search", "/privacy", "/terms"]) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

test("404 for unknown article and page", async ({ page }) => {
  expect((await page.goto("/article/does-not-exist"))?.status()).toBe(404);
  await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
  expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  expect((await page.goto("/article/demo-draft"))?.status()).toBe(404); // المسودات غير متاحة للعامة
});

test("archive filters by month", async ({ page }) => {
  await page.goto("/archive");
  const monthLink = page.locator('a[href*="month="]').first();
  await monthLink.click();
  await expect(page).toHaveURL(/month=/);
  await expect(page.locator("article").first()).toBeVisible();
});

test("comment moderation flow", async ({ page }) => {
  await page.goto("/article/demo-article-3");
  await page.getByLabel("الاسم").fill("قارئ");
  await page.getByLabel("البريد الإلكتروني (لن يُنشر)").fill("reader@example.com");
  await page.getByRole("textbox", { name: "التعليق" }).fill("تعليق اختباري للمراجعة");
  await page.getByRole("button", { name: "إرسال التعليق" }).click();
  await expect(page.getByText("سيظهر تعليقك بعد مراجعته")).toBeVisible();
  await page.reload();
  await expect(page.getByText("تعليق اختباري للمراجعة")).toHaveCount(0);

  await login(page, OWNER);
  await page.goto("/admin/comments");
  const row = page.getByTestId("comment-row").filter({ hasText: "تعليق اختباري للمراجعة" });
  await row.getByRole("button", { name: "موافقة ونشر" }).click();
  await expect(page.getByText("تم تحديث التعليق")).toBeVisible();
  await page.goto("/article/demo-article-3");
  await expect(page.getByText("تعليق اختباري للمراجعة")).toBeVisible();
});

test("contact form and newsletter store data visible in admin", async ({ page }) => {
  await page.goto("/contact");
  await page.locator("#ct-name").fill("زائر");
  await page.locator("#ct-email").fill("visitor@example.com");
  await page.getByLabel("الموضوع").fill("طلب حوار");
  await page.getByLabel("الرسالة").fill("أرغب في إجراء حوار صحفي معكم.");
  await page.getByRole("button", { name: "إرسال الرسالة" }).click();
  await expect(page.getByText("تم استلام رسالتك بنجاح")).toBeVisible();

  await page.goto("/");
  const nl = page.locator("main").getByPlaceholder("name@example.com");
  await nl.fill("fan@example.com");
  await page.locator("main").getByRole("button", { name: "اشترك" }).click();
  await expect(page.locator("main").getByText("تم الاشتراك بنجاح")).toBeVisible();

  await login(page, OWNER);
  await page.goto("/admin/messages");
  await expect(page.getByText("طلب حوار")).toBeVisible();
  await page.goto("/admin/subscribers");
  await expect(page.getByRole("cell", { name: "fan@example.com" })).toBeVisible();
});

test("author profile is editable and appears publicly; views are tracked", async ({ page }) => {
  await login(page, OWNER);
  await page.goto("/admin/author");
  await page.locator('input[name="authorTitle"]').fill("صفة اختبارية");
  await page.getByRole("button", { name: "حفظ بيانات الكاتب" }).click();
  await expect(page.getByText("تم حفظ بيانات الكاتب")).toBeVisible();
  await page.goto("/about");
  await expect(page.getByText("صفة اختبارية")).toBeVisible();

  await page.goto("/admin/analytics");
  await expect(page.getByText("مشاهدات الصفحات")).toBeVisible();
});
