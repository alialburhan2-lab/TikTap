import { v2 as cloudinary } from "cloudinary";
import type { StorageDriver } from "./types";

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const cloudinaryDriver: StorageDriver = {
  name: "cloudinary",
  async put(key, data) {
    configure();
    const folder = process.env.CLOUDINARY_FOLDER || "ghassan";
    const publicId = key.replace(/\.[a-z0-9]+$/i, "");
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, public_id: publicId, resource_type: "image", overwrite: false }, (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"));
          else resolve(res as { secure_url: string; public_id: string });
        })
        .end(data);
    });
    return { url: result.secure_url, key: result.public_id, driver: "cloudinary" };
  },
  async delete(key) {
    configure();
    await cloudinary.uploader.destroy(key, { resource_type: "image" }).catch(() => undefined);
  },
};
