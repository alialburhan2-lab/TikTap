import type { Media } from "@prisma/client";
import { prisma } from "../db";
import { getDriver, makeStorageKey, processImage } from "../storage";

/** معالجة صورة وتخزينها وتسجيلها في مكتبة الوسائط */
export async function storeImage(input: Buffer, filename: string, uploadedById: string, alt?: string | null): Promise<Media> {
  const img = await processImage(input);
  const driver = getDriver();
  const stored = await driver.put(makeStorageKey(img.ext), img.data, img.mimeType);
  return prisma.media.create({
    data: {
      url: stored.url,
      storageKey: stored.key,
      driver: stored.driver,
      filename: filename.slice(0, 200) || "image",
      mimeType: img.mimeType,
      size: img.data.length,
      width: img.width,
      height: img.height,
      alt: alt?.trim().slice(0, 250) || null,
      uploadedById,
    },
  });
}

export async function removeMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;
  await getDriver(media.driver).delete(media.storageKey);
  await prisma.media.delete({ where: { id } });
}
