import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/env";

/**
 * Storage for SENSITIVE verification documents. Never public:
 * - Supabase mode: private bucket "verification-docs" (no public policy); staff get short-lived signed URLs.
 * - Demo mode: .data/private-docs (outside /public, git-ignored), streamed only through an authenticated route.
 */
const BUCKET = "verification-docs";
const DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), ".data"), "private-docs");
export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_BYTES = 10 * 1024 * 1024;

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

export async function storePrivateFile(id: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only PDF, JPEG or PNG files are accepted.");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 10 MB.");
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const key = `${id}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await admin().storage.from(BUCKET).upload(key, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return `supabase:${key}`;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, key), bytes);
  return `local:${key}`;
}

export async function readPrivateFile(storagePath: string): Promise<{ redirect?: string; body?: Buffer; type?: string }> {
  const [kind, key] = storagePath.split(":");
  if (!key || key.includes("/") || key.includes("..")) throw new Error("Invalid path");
  if (kind === "supabase") {
    const { data, error } = await admin().storage.from(BUCKET).createSignedUrl(key, 60);
    if (error || !data) throw new Error("Could not sign URL");
    return { redirect: data.signedUrl };
  }
  const body = await fs.readFile(path.join(DIR, key));
  const type = key.endsWith(".pdf") ? "application/pdf" : key.endsWith(".png") ? "image/png" : "image/jpeg";
  return { body, type };
}
