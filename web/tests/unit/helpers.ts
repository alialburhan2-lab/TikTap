import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "ArticleTag","Comment","PageView","Article","Tag","Category","Media","User","LoginAttempt","RateLimitHit","NewsletterSubscriber","ContactMessage","SiteSettings" CASCADE`,
  );
}

let n = 0;
export async function makeUser(role: Role) {
  n++;
  return prisma.user.create({
    data: { email: `${role.toLowerCase()}${n}@test.local`, name: `${role} ${n}`, role, passwordHash: await bcrypt.hash("Password123x", 4) },
  });
}
