import { del, put } from "@vercel/blob";
import type { StorageDriver } from "./types";

/** تخزين Vercel Blob — يتطلب BLOB_READ_WRITE_TOKEN (يُضاف تلقائياً عند ربط المخزن بالمشروع) */
export const vercelBlobDriver: StorageDriver = {
  name: "vercel-blob",
  async put(key, data, contentType) {
    const blob = await put(`uploads/${key}`, data, { access: "public", contentType, addRandomSuffix: false });
    return { url: blob.url, key: blob.url, driver: "vercel-blob" };
  },
  async delete(key) {
    await del(key).catch(() => undefined);
  },
};
