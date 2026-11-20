import { execSync } from "child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL || "postgresql://ghassan:ghassan_dev@localhost:5432/ghassan_test?schema=public";
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url, CHECKPOINT_DISABLE: "1", PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}
