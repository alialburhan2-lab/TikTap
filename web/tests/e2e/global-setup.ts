import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import config from "../../playwright.config";

export default async function globalSetup() {
  const env: NodeJS.ProcessEnv = { ...process.env, ...(config.metadata!.env as Record<string, string>), CHECKPOINT_DISABLE: "1" };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL! } } });
  await prisma.$executeRawUnsafe(
    `TRUNCATE "ArticleTag","Comment","PageView","Article","Tag","Category","Media","User","LoginAttempt","RateLimitHit","NewsletterSubscriber","ContactMessage","SiteSettings" CASCADE`,
  );
  await prisma.$disconnect();
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
}
