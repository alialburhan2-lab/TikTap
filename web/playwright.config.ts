import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);
export const E2E_DB = process.env.E2E_DATABASE_URL || "postgresql://ghassan:ghassan_dev@localhost:5432/ghassan_e2e?schema=public";

const env = {
  DATABASE_URL: E2E_DB,
  AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e",
  AUTH_TRUST_HOST: "true",
  ADMIN_EMAIL: "owner@e2e.local",
  ADMIN_PASSWORD: "Owner#E2E2026",
  SEED_DEMO: "true",
  UPLOAD_DIR: "./test-results/uploads-e2e",
  STORAGE_DRIVER: "local",
  ANALYTICS_SALT: "e2e",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, locale: "ar", trace: "off" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // يتطلب تشغيل npm run build مسبقاً
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 120_000,
    env,
  },
  metadata: { env },
});
