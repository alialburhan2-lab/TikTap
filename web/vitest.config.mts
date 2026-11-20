import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    globalSetup: ["tests/unit/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://ghassan:ghassan_dev@localhost:5432/ghassan_test?schema=public",
      AUTH_SECRET: "test-secret-test-secret-test-secret",
      ANALYTICS_SALT: "test",
      UPLOAD_DIR: "./test-results/uploads-unit",
      STORAGE_DRIVER: "local",
    },
  },
});
