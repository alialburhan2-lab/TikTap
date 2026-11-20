import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { StorageDriver } from "./types";

export function uploadRoot(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

/** يمنع الخروج من مجلد الرفع (Path traversal) */
export function safeLocalPath(key: string): string | null {
  const root = uploadRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) return null;
  return full;
}

export const localDriver: StorageDriver = {
  name: "local",
  async put(key, data) {
    const full = safeLocalPath(key);
    if (!full) throw new Error("Invalid storage key");
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { url: `/uploads/${key}`, key, driver: "local" };
  },
  async delete(key) {
    const full = safeLocalPath(key);
    if (!full) return;
    await unlink(full).catch(() => undefined);
  },
};
