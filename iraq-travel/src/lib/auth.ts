import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { AppUser, EntityName, Role } from "@/data/types";
import { authSecret, demoAuthEnabled, demoPassword, isProduction, supabaseConfigured } from "@/lib/env";
import { repo } from "@/lib/store";
import { canManage, isStaff } from "@/lib/permissions";
import { SEED_DATE } from "@/data/helpers";

export const SESSION_COOKIE = "it_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionUser = Pick<AppUser, "id" | "email" | "displayName" | "role">;

// ---------- password hashing (demo store) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored?.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// ---------- signed session token ----------
function sign(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
    if (typeof data.sub !== "string" || data.exp * 1000 < now) return null;
    return data.sub;
  } catch {
    return null;
  }
}

// ---------- demo accounts ----------
export const DEMO_ACCOUNTS: { email: string; role: Role; displayName: string }[] = [
  { email: "admin@iraqtravel.demo", role: "super_admin", displayName: "Demo Super Admin" },
  { email: "editor@iraqtravel.demo", role: "editor", displayName: "Demo Editor" },
  { email: "prices@iraqtravel.demo", role: "price_manager", displayName: "Demo Price Manager" },
  { email: "safety@iraqtravel.demo", role: "safety_editor", displayName: "Demo Safety Editor" },
  { email: "verify@iraqtravel.demo", role: "verification_officer", displayName: "Demo Verification Officer" },
];

async function ensureDemoUsers(): Promise<void> {
  const users = await repo().list("users");
  for (const acc of DEMO_ACCOUNTS) {
    if (users.some((u) => u.email === acc.email)) continue;
    await repo().upsert("users", {
      id: crypto.randomUUID(), createdAt: SEED_DATE, updatedAt: SEED_DATE, published: false, isDemo: true,
      email: acc.email, displayName: acc.displayName, role: acc.role, disabled: false, passwordHash: hashPassword(demoPassword()),
    });
  }
}

// ---------- login / logout ----------
export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase();
  if (supabaseConfigured()) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: normalized, password });
    if (error || !data.user) return null;
    const profile = await repo().get("users", data.user.id);
    if (!profile || profile.disabled) return null;
    return { id: profile.id, email: profile.email, displayName: profile.displayName, role: profile.role };
  }
  if (demoAuthEnabled()) {
    await ensureDemoUsers();
    const user = (await repo().list("users")).find((u) => u.email === normalized);
    if (!user || user.disabled || !verifyPassword(password, user.passwordHash)) return null;
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }
  return null;
}

export async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true, sameSite: "lax", secure: isProduction, path: "/", maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Resolve the current user from the signed cookie, re-reading role/disabled from the database each time. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const user = await repo().get("users", id);
  if (!user || user.disabled) return null;
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect("/admin/login");
  return user;
}

export async function requireEntityPermission(entity: EntityName): Promise<SessionUser> {
  const user = await requireStaff();
  if (!canManage(user.role, entity)) redirect("/admin?denied=1");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireStaff();
  if (user.role !== "super_admin" && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}
