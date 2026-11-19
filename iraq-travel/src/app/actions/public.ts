"use server";

import { z } from "zod";
import { REPORT_TYPES } from "@/data/types";
import { repo, newId } from "@/lib/store";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };

const now = () => new Date().toISOString();
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "form")] = issue.message;
  return out;
}

const reportSchema = z.object({
  type: z.enum(REPORT_TYPES as [string, ...string[]]),
  providerName: z.string().trim().min(2).max(160),
  providerType: opt(60),
  governorateId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  description: z.string().trim().min(20, "Please describe what happened (at least 20 characters).").max(4000),
  amountPaid: opt(60),
  expectedAmount: opt(60),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((v) => v || null),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => v || null),
  consent: z.literal("on", { message: "Please confirm the report is truthful." }),
});

/** Traveler Protection: fraud / overcharging / fake booking / incorrect price / complaint. Stored privately, never auto-published. */
export async function submitReport(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true }; // honeypot: silently drop bots
  if (!(await rateLimit("report", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many reports from this connection. Please try again later." };
  const parsed = reportSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { consent: _consent, ...d } = parsed.data;
  void _consent;
  await repo().upsert("scamReports", {
    id: newId(), createdAt: now(), updatedAt: now(), published: false,
    type: d.type as (typeof REPORT_TYPES)[number], providerName: d.providerName, providerType: d.providerType, governorateId: d.governorateId,
    description: d.description, amountPaid: d.amountPaid, expectedAmount: d.expectedAmount, incidentDate: d.incidentDate, contactEmail: d.contactEmail,
    status: "new", actions: [],
  });
  return { ok: true };
}

const reviewSchema = z.object({
  targetType: z.enum(["hotel", "restaurant", "site", "tourGuide"]),
  targetId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20, "At least 20 characters.").max(3000),
  authorName: z.string().trim().min(2).max(80),
});

/** Reviews always start as "pending" and require moderation before they appear. */
export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true };
  if (!(await rateLimit("review", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many reviews from this connection. Please try again later." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await repo().upsert("reviews", { id: newId(), createdAt: now(), updatedAt: now(), published: true, ...parsed.data, status: "pending" });
  return { ok: true };
}

const itinerarySchema = z.object({ title: z.string().trim().min(1).max(160), input: z.unknown(), days: z.array(z.unknown()).max(30) });

/** Optional: store an anonymous itinerary so it can be reopened by id. */
export async function saveItinerary(payload: unknown): Promise<{ ok: boolean; id?: string }> {
  if (!(await rateLimit("itinerary", 20, 60 * 60 * 1000))) return { ok: false };
  const parsed = itinerarySchema.safeParse(payload);
  if (!parsed.success || JSON.stringify(payload).length > 100_000) return { ok: false };
  const id = newId();
  await repo().upsert("travelItineraries", { id, createdAt: now(), updatedAt: now(), published: false, userId: null, title: parsed.data.title, input: parsed.data.input, days: parsed.data.days });
  return { ok: true, id };
}
