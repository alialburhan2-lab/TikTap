import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { EntityMap, EntityName, Store } from "@/data/types";
import { buildSeedStore } from "@/data/seed";
import type { Repository } from "./types";

/**
 * Local JSON-file repository for development / demo mode.
 * Data lives in .data/store.json (git-ignored) and is initialised from the seed on first use.
 * Not suitable for serverless production (read-only / ephemeral filesystems) — use Supabase there.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "store.json");

let cache: { store: Store; mtime: number } | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Store> {
  try {
    const stat = await fs.stat(FILE);
    if (cache && cache.mtime === stat.mtimeMs) return cache.store;
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    const seed = buildSeedStore();
    const store = { ...seed, ...parsed } as Store; // new entity collections get seeded automatically
    cache = { store, mtime: stat.mtimeMs };
    return store;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      const seed = buildSeedStore();
      cache = { store: seed, mtime: -1 };
      return seed;
    }
    throw err;
  }
}

async function persist(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 1), "utf8");
  await fs.rename(tmp, FILE);
  const stat = await fs.stat(FILE);
  cache = { store, mtime: stat.mtimeMs };
}

function mutate<T>(fn: (store: Store) => T): Promise<T> {
  const run = writeChain.then(async () => {
    const store = await load();
    const result = fn(store);
    await persist(store);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export const fileRepository: Repository = {
  kind: "demo-file",
  async list<K extends EntityName>(entity: K) {
    const store = await load();
    return structuredClone(store[entity]) as EntityMap[K][];
  },
  async get<K extends EntityName>(entity: K, id: string) {
    const store = await load();
    const rec = (store[entity] as EntityMap[K][]).find((r) => r.id === id);
    return rec ? structuredClone(rec) : null;
  },
  upsert<K extends EntityName>(entity: K, record: EntityMap[K]) {
    return mutate((store) => {
      const list = store[entity] as EntityMap[K][];
      const idx = list.findIndex((r) => r.id === record.id);
      if (idx >= 0) list[idx] = record;
      else list.push(record);
      return structuredClone(record);
    });
  },
  remove<K extends EntityName>(entity: K, id: string) {
    return mutate((store) => {
      (store[entity] as EntityMap[K][]) = (store[entity] as EntityMap[K][]).filter((r) => r.id !== id);
    });
  },
};
