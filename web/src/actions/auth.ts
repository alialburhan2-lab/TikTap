"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const callbackUrl = String(formData.get("callbackUrl") || "/admin");
  const safeCallback = callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("//") ? callbackUrl : "/admin";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: safeCallback,
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      if (code === "rate_limited") {
        return { error: "تم إيقاف تسجيل الدخول مؤقتاً بسبب محاولات فاشلة متعددة. حاول بعد 15 دقيقة." };
      }
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    throw err; // إعادة التوجيه بعد النجاح
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
