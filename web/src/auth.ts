import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/db";
import { loginSchema } from "./lib/validation";
import { isLoginBlocked, recordLoginAttempt } from "./lib/rate-limit";
import { hashValue } from "./lib/security";

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

// تجزئة وهمية لمقاومة هجمات التوقيت عند عدم وجود المستخدم
const DUMMY_HASH = "$2b$12$Nki7VkiEdHttlcWIyP4/9Ozrs88IuLHOfaSVkO513jexwd5aOegMW";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const fwd = request?.headers?.get?.("x-forwarded-for") ?? "";
        const ipKey = hashValue(fwd.split(",")[0]?.trim() || "local");

        if (await isLoginBlocked(email, ipKey)) throw new RateLimitedError();

        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok || !user.active) {
          await recordLoginAttempt(email, ipKey, false);
          return null;
        }
        await recordLoginAttempt(email, ipKey, true);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
