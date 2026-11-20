import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "./db";

export type SocialLinks = Partial<Record<"x" | "facebook" | "instagram" | "youtube" | "telegram" | "linkedin", string>>;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (existing) return existing;
  return prisma.siteSettings.upsert({ where: { id: "site" }, update: {}, create: { id: "site" } });
});

export function socialLinks(settings: SiteSettings): SocialLinks {
  const v = settings.socialLinks;
  if (v && typeof v === "object" && !Array.isArray(v)) return v as SocialLinks;
  return {};
}
