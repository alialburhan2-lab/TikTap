import "server-only";
import { supabaseConfigured } from "@/lib/env";
import { fileRepository } from "./file-store";
import { supabaseRepository } from "./supabase-store";
import type { Repository } from "./types";

export function repo(): Repository {
  return supabaseConfigured() ? supabaseRepository : fileRepository;
}

export function newId(prefix = ""): string {
  return `${prefix}${crypto.randomUUID()}`;
}
