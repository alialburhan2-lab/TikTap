/** Centralised environment flags. Server-only values are read lazily. */
export const isProduction = process.env.NODE_ENV === "production";

export function supabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function showDemoData(): boolean {
  return (process.env.NEXT_PUBLIC_SHOW_DEMO_DATA ?? "true") !== "false";
}

export function demoAuthEnabled(): boolean {
  const flag = process.env.DEMO_AUTH_ENABLED;
  if (flag === "false") return false;
  if (flag === "true") return true;
  // Default: on in development when Supabase is not configured; never on in production implicitly.
  return !isProduction && !supabaseConfigured();
}

export const DEV_DEMO_PASSWORD = "IraqTravel-Demo-2026";

export function demoPassword(): string {
  const p = process.env.DEMO_ADMIN_PASSWORD;
  if (p && p.length >= 10) return p;
  if (isProduction) throw new Error("DEMO_ADMIN_PASSWORD (min 10 chars) is required when demo auth is enabled in production.");
  return DEV_DEMO_PASSWORD;
}

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (isProduction) throw new Error("AUTH_SECRET (min 32 chars) is required in production.");
  return "dev-only-insecure-secret-change-me-0123456789";
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function iqdPerUsd(): number {
  const n = Number(process.env.NEXT_PUBLIC_IQD_PER_USD);
  return Number.isFinite(n) && n > 0 ? n : 1310;
}
