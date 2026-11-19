"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EntityMap, EntityName, ProviderVerificationLevel, ReportStatus, Role } from "@/data/types";
import { PROVIDER_LEVELS, REPORT_STATUSES, ROLES } from "@/data/types";
import { authenticate, endSession, getCurrentUser, hashPassword, requireEntityPermission, requireRole, startSession } from "@/lib/auth";
import { canMarkVerified, canSetProviderLevel } from "@/lib/permissions";
import { getEntityConfig, slugify } from "@/lib/admin/entities";
import { levelAllowed, parseEntityForm, type Level } from "@/lib/admin/form";
import { audit } from "@/lib/admin/audit";
import { repo, newId } from "@/lib/store";
import { rateLimit } from "@/lib/rate-limit";
import { demoAuthEnabled, supabaseConfigured } from "@/lib/env";
import { storePrivateFile } from "@/lib/private-files";

export type AdminFormState = { ok?: boolean; message?: string; errors?: Record<string, string> };
const nowIso = () => new Date().toISOString();

function refreshPublic() {
  revalidatePath("/", "layout");
}

// ---------------- auth ----------------
export async function loginAction(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  if (!(await rateLimit("login", 10, 15 * 60 * 1000))) return { message: "Too many attempts. Try again in 15 minutes." };
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { message: "Email and password are required." };
  const user = await authenticate(email, password);
  if (!user) return { message: "Invalid email or password." };
  await startSession(user.id);
  await audit(user, "login", "users", user.id);
  redirect("/admin");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await audit(user, "logout", "users", user.id);
  await endSession();
  redirect("/admin/login");
}

// ---------------- generic content ----------------
type ProviderEntity = "hotels" | "restaurants" | "tourGuides" | "transportProviders";
const PROVIDER_TYPE: Record<ProviderEntity, string> = { hotels: "hotel", restaurants: "restaurant", tourGuides: "tourGuide", transportProviders: "transportProvider" };

export async function saveEntityAction(entityName: string, id: string | null, _: AdminFormState, form: FormData): Promise<AdminFormState> {
  const cfg = getEntityConfig(entityName);
  if (!cfg) return { message: "Unknown content type." };
  const entity = cfg.name;
  const user = await requireEntityPermission(entity);
  const { values, errors } = parseEntityForm(cfg, form);

  const existing = id ? await repo().get(entity, id) : null;
  if (id && !existing) return { message: "Record not found." };
  const prev = (existing ?? {}) as Record<string, unknown>;

  if (cfg.slugFrom && !values.slug) {
    const src = values[cfg.slugFrom];
    values.slug = slugify(typeof src === "string" ? src : (src as { en?: string })?.en ?? "");
  }
  if (typeof values.slug === "string") {
    const all = await repo().list(entity);
    if (all.some((r) => (r as { slug?: string }).slug === values.slug && r.id !== id)) errors.slug = "This slug is already used";
  }

  // Integrity rule: only authorised roles may mark data as "verified".
  if (values.verificationStatus === "verified" && prev.verificationStatus !== "verified" && !canMarkVerified(user.role, entity)) {
    errors.verificationStatus = "Your role cannot mark this record as verified.";
  }
  // Integrity rule: provider levels are raised only by verification officers, and only up to an approved document.
  if ("providerLevel" in values) {
    const requested = values.providerLevel as Level;
    const before = (prev.providerLevel as Level | undefined) ?? "unverified";
    if (requested !== before) {
      if (!canSetProviderLevel(user.role)) {
        values.providerLevel = before;
      } else if (requested !== "unverified") {
        const docs = id ? (await repo().list("verificationDocuments")).filter((d) => d.providerId === id && d.providerType === PROVIDER_TYPE[entity as ProviderEntity]) : [];
        if (!levelAllowed(requested, docs)) errors.providerLevel = "No approved verification document supports this level. Review documents under Verification first.";
      }
    }
  }
  // Safety: an emergency contact cannot be published as verified without an official source.
  if (entity === "emergencyContacts" && values.published && !values.sourceId) errors.sourceId = "An official source is required before publishing an emergency contact.";
  if (entity === "safetyAdvisories" && values.kind === "official" && !values.sourceUrl) errors.sourceUrl = "Official advisories must link to the issuing source.";

  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const record = { ...prev, ...values, id: id ?? newId(), createdAt: (prev.createdAt as string) ?? nowIso(), updatedAt: nowIso() } as EntityMap[typeof entity];
  if (record.published === undefined) (record as { published: boolean }).published = true;
  await repo().upsert(entity, record);
  const changed = Object.keys(values).filter((k) => JSON.stringify(values[k]) !== JSON.stringify(prev[k]));
  await audit(user, id ? "update" : "create", entity, record.id, changed.length ? `fields: ${changed.join(", ")}` : undefined);
  refreshPublic();
  redirect(`/admin/content/${entity}?saved=1`);
}

export async function deleteEntityAction(entityName: string, id: string) {
  const cfg = getEntityConfig(entityName);
  if (!cfg) throw new Error("Unknown content type");
  const user = await requireEntityPermission(cfg.name);
  const existing = await repo().get(cfg.name, id);
  if (!existing) return;
  await repo().remove(cfg.name, id);
  await audit(user, "delete", cfg.name, id, JSON.stringify(existing).slice(0, 500));
  refreshPublic();
  redirect(`/admin/content/${cfg.name}?deleted=1`);
}

// ---------------- complaints / scam reports ----------------
export async function updateReportAction(id: string, _: AdminFormState, form: FormData): Promise<AdminFormState> {
  const user = await requireRole("verification_officer");
  const parsed = z.object({ status: z.enum(REPORT_STATUSES as [ReportStatus, ...ReportStatus[]]), note: z.string().trim().min(3, "Describe the action taken").max(2000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Invalid input" };
  const report = await repo().get("scamReports", id);
  if (!report) return { message: "Report not found" };
  report.status = parsed.data.status;
  report.actions = [...report.actions, { at: nowIso(), by: user.email, note: parsed.data.note }];
  report.updatedAt = nowIso();
  await repo().upsert("scamReports", report);
  await audit(user, "report_action", "scamReports", id, `${parsed.data.status}: ${parsed.data.note}`);
  return { ok: true, message: "Saved." };
}

// ---------------- verification documents ----------------
const docSchema = z.object({
  providerKey: z.string().regex(/^(hotels|restaurants|tourGuides|transportProviders):[0-9a-f-]{36}$/),
  docType: z.enum(["business_license", "tourism_license", "identity", "contact_check", "other"]),
  requestedLevel: z.enum(PROVIDER_LEVELS.filter((l) => l !== "unverified") as [ProviderVerificationLevel, ...ProviderVerificationLevel[]]),
  notes: z.string().trim().max(2000).optional(),
});

export async function uploadDocumentAction(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const user = await requireRole("verification_officer");
  const parsed = docSchema.safeParse({ providerKey: form.get("providerKey"), docType: form.get("docType"), requestedLevel: form.get("requestedLevel"), notes: form.get("notes") || undefined });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Invalid input" };
  const [entity, providerId] = parsed.data.providerKey.split(":") as [ProviderEntity, string];
  if (!(await repo().get(entity, providerId))) return { message: "Provider not found" };
  const file = form.get("file");
  const id = newId();
  let storagePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    try { storagePath = await storePrivateFile(id, file); } catch (e) { return { message: (e as Error).message }; }
  } else if (parsed.data.docType !== "contact_check") {
    return { message: "A document file is required (contact checks may be recorded without a file)." };
  }
  await repo().upsert("verificationDocuments", {
    id, createdAt: nowIso(), updatedAt: nowIso(), published: false, providerType: PROVIDER_TYPE[entity] as "hotel", providerId, docType: parsed.data.docType,
    storagePath, requestedLevel: parsed.data.requestedLevel, status: "pending", reviewedBy: null, reviewedAt: null, notes: parsed.data.notes ?? null,
  });
  await audit(user, "document_upload", "verificationDocuments", id, `${entity}/${providerId} → ${parsed.data.requestedLevel}`);
  return { ok: true, message: "Document stored privately and queued for review." };
}

const ENTITY_FOR_TYPE: Record<string, ProviderEntity> = { hotel: "hotels", restaurant: "restaurants", tourGuide: "tourGuides", transportProvider: "transportProviders" };

export async function reviewDocumentAction(id: string, decision: "approved" | "rejected", form: FormData) {
  const user = await requireRole("verification_officer");
  const doc = await repo().get("verificationDocuments", id);
  if (!doc || doc.status !== "pending") return;
  doc.status = decision;
  doc.reviewedBy = user.email;
  doc.reviewedAt = nowIso();
  doc.notes = [doc.notes, String(form.get("notes") ?? "").trim()].filter(Boolean).join("\n") || null;
  doc.updatedAt = nowIso();
  await repo().upsert("verificationDocuments", doc);
  if (decision === "approved") {
    const entity = ENTITY_FOR_TYPE[doc.providerType];
    const provider = await repo().get(entity, doc.providerId);
    if (provider) {
      const docs = (await repo().list("verificationDocuments")).filter((d) => d.providerId === doc.providerId);
      const ranks = PROVIDER_LEVELS;
      const target = doc.requestedLevel;
      if (levelAllowed(target, docs) && ranks.indexOf(target) > ranks.indexOf(provider.providerLevel)) {
        (provider as { providerLevel: ProviderVerificationLevel }).providerLevel = target;
        provider.updatedAt = nowIso();
        await repo().upsert(entity, provider as EntityMap[typeof entity]);
      }
    }
  }
  await audit(user, `document_${decision}`, "verificationDocuments", id, `${doc.providerType}/${doc.providerId} ${doc.requestedLevel}`);
  refreshPublic();
  redirect("/admin/verification");
}

// ---------------- users ----------------
export async function createUserAction(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const actor = await requireRole("super_admin");
  const parsed = z.object({
    email: z.string().trim().toLowerCase().email(), displayName: z.string().trim().min(2).max(80),
    role: z.enum(ROLES as [Role, ...Role[]]), password: z.string().min(12, "Password must be at least 12 characters").max(200),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Invalid input" };
  const users = await repo().list("users");
  if (users.some((u) => u.email === parsed.data.email)) return { message: "A user with this email already exists." };
  let id: string = newId();
  if (supabaseConfigured()) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.admin.createUser({ email: parsed.data.email, password: parsed.data.password, email_confirm: true });
    if (error || !data.user) return { message: `Supabase: ${error?.message ?? "could not create user"}` };
    id = data.user.id;
  } else if (!demoAuthEnabled()) {
    return { message: "No authentication backend configured." };
  }
  await repo().upsert("users", {
    id, createdAt: nowIso(), updatedAt: nowIso(), published: false, email: parsed.data.email, displayName: parsed.data.displayName, role: parsed.data.role, disabled: false,
    ...(supabaseConfigured() ? {} : { passwordHash: hashPassword(parsed.data.password) }),
  });
  await audit(actor, "user_create", "users", id, `${parsed.data.email} as ${parsed.data.role}`);
  return { ok: true, message: "User created." };
}

export async function updateUserAction(id: string, form: FormData) {
  const actor = await requireRole("super_admin");
  const user = await repo().get("users", id);
  if (!user) return;
  const role = String(form.get("role"));
  const disabled = form.get("disabled") === "on";
  if (id === actor.id && (role !== "super_admin" || disabled)) return; // prevent locking yourself out
  if ((ROLES as string[]).includes(role)) user.role = role as Role;
  user.disabled = disabled;
  user.updatedAt = nowIso();
  await repo().upsert("users", user);
  await audit(actor, "user_update", "users", id, `role=${user.role} disabled=${disabled}`);
  redirect("/admin/users");
}

