import { expect, type Page } from "@playwright/test";

export const OWNER = { email: "owner@e2e.local", password: "Owner#E2E2026" };
export const EDITOR = { email: "editor@demo.local", password: "Demo#Pass2026" };
export const AUTHOR = { email: "author@demo.local", password: "Demo#Pass2026" };

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(user.email);
  await page.getByLabel("كلمة المرور").fill(user.password);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByTestId("current-user")).toBeVisible();
}
