import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EntityMap, EntityName } from "@/data/types";
import { TABLES, type Repository } from "./types";

/**
 * Supabase/PostgreSQL repository. Column names are the snake_case form of the TypeScript
 * field names (see supabase/migrations). Nested objects are stored as jsonb.
 * Uses the service-role key, so it must only be called from server code AFTER the
 * application's own permission checks (lib/auth + lib/permissions).
 */
let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toRow(rec: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (k === "passwordHash") continue; // never stored in Supabase; auth.users owns credentials
    out[toSnake(k)] = v;
  }
  return out;
}
function fromRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out as T;
}

export const supabaseRepository: Repository = {
  kind: "supabase",
  async list<K extends EntityName>(entity: K) {
    const { data, error } = await db().from(TABLES[entity]).select("*").limit(5000);
    if (error) throw new Error(`Supabase list ${entity}: ${error.message}`);
    return (data ?? []).map((r) => fromRow<EntityMap[K]>(r));
  },
  async get<K extends EntityName>(entity: K, id: string) {
    const { data, error } = await db().from(TABLES[entity]).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase get ${entity}: ${error.message}`);
    return data ? fromRow<EntityMap[K]>(data) : null;
  },
  async upsert<K extends EntityName>(entity: K, record: EntityMap[K]) {
    const { data, error } = await db().from(TABLES[entity]).upsert(toRow(record)).select("*").single();
    if (error) throw new Error(`Supabase upsert ${entity}: ${error.message}`);
    return fromRow<EntityMap[K]>(data);
  },
  async remove<K extends EntityName>(entity: K, id: string) {
    const { error } = await db().from(TABLES[entity]).delete().eq("id", id);
    if (error) throw new Error(`Supabase delete ${entity}: ${error.message}`);
  },
};
