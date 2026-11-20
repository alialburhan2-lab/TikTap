import { createHash } from "crypto";
import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") || "0.0.0.0";
}

export function hashValue(value: string): string {
  const salt = process.env.ANALYTICS_SALT || process.env.AUTH_SECRET || "salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
}

/** حماية CSRF لمسارات API: التحقق من تطابق Origin مع المضيف */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
