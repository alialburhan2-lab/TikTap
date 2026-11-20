import { prisma } from "./db";

/**
 * محدد معدل مبني على قاعدة البيانات (يعمل مع عدة نسخ من الخادم).
 * يعيد true إذا كان الطلب مسموحاً ويسجّل المحاولة.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return false;
  await prisma.rateLimitHit.create({ data: { key } });
  // تنظيف عشوائي للسجلات القديمة
  if (Math.random() < 0.02) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  }
  return true;
}

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_PER_EMAIL = 5;
export const LOGIN_MAX_PER_IP = 20;

/** هل الحساب/العنوان مقفل مؤقتاً بسبب محاولات فاشلة كثيرة؟ */
export async function isLoginBlocked(email: string, ipKey: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { key: `email:${email}`, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { key: `ip:${ipKey}`, success: false, createdAt: { gte: since } } }),
  ]);
  return byEmail >= LOGIN_MAX_PER_EMAIL || byIp >= LOGIN_MAX_PER_IP;
}

export async function recordLoginAttempt(email: string, ipKey: string, success: boolean) {
  if (success) {
    // عند النجاح نمسح المحاولات الفاشلة لهذا البريد
    await prisma.loginAttempt.deleteMany({ where: { key: `email:${email}`, success: false } });
    return;
  }
  await prisma.loginAttempt.createMany({
    data: [
      { key: `email:${email}`, success },
      { key: `ip:${ipKey}`, success },
    ],
  });
}
