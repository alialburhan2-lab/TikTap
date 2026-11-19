import "server-only";
import { headers } from "next/headers";

/** Small in-memory sliding-window limiter (per server instance). Use a shared store (e.g. Redis) in multi-instance production. */
const hits = new Map<string, number[]>();

export async function rateLimit(bucket: string, max: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}
