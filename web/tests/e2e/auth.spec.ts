import { expect, test } from "@playwright/test";
import { AUTHOR, EDITOR, login, OWNER } from "./helpers";

test("admin routes redirect to login when unauthenticated", async ({ page }) => {
  for (const p of ["/admin", "/admin/articles", "/admin/users", "/admin/settings"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
});

test("protected APIs reject anonymous requests", async ({ request, baseURL }) => {
  const up = await request.post("/api/upload", { headers: { origin: baseURL! }, multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
  expect(up.status()).toBe(401);
  const cross = await request.post("/api/upload", { headers: { origin: "http://evil.example" }, multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
  expect(cross.status()).toBe(403);
  expect((await request.get("/api/media")).status()).toBe(401);
  expect((await request.get("/api/admin/subscribers/export")).status()).toBe(401);
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(OWNER.email);
  await page.getByLabel("كلمة المرور").fill("wrong-password-1");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByText("البريد الإلكتروني أو كلمة المرور غير صحيحة")).toBeVisible();
});

test("owner logs in and out", async ({ page }) => {
  await login(page, OWNER);
  await expect(page.getByRole("link", { name: "المستخدمون والصلاحيات" })).toBeVisible();
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("author permissions are restricted", async ({ page }) => {
  await login(page, AUTHOR);
  await expect(page.getByRole("link", { name: "المستخدمون والصلاحيات" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "إعدادات الموقع" })).toHaveCount(0);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/denied=1/);
  await page.goto("/admin/articles/new");
  const options = await page.locator("#status option").allTextContents();
  expect(options).toEqual(["مسودة", "قيد المراجعة"]);
});

test("editor cannot access settings or users", async ({ page }) => {
  await login(page, EDITOR);
  await expect(page.getByRole("link", { name: "التصنيفات" })).toBeVisible();
  for (const p of ["/admin/settings", "/admin/users", "/admin/author"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/denied=1/);
  }
});
