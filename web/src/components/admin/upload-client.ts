export interface UploadedImage {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export async function uploadImage(file: File, alt?: string): Promise<UploadedImage> {
  const fd = new FormData();
  fd.append("file", file);
  if (alt) fd.append("alt", alt);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "تعذّر رفع الصورة");
  return data as UploadedImage;
}
