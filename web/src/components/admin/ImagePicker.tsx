"use client";

import { useRef, useState } from "react";
import { uploadImage, type UploadedImage } from "./upload-client";

/**
 * حقل صورة: رفع مع معاينة قبل الحفظ، أو اختيار من المكتبة.
 * يخزن الرابط في حقل مخفي باسم name.
 */
export function ImagePicker({
  name,
  defaultValue,
  altName,
  defaultAlt,
  label = "الصورة",
}: {
  name: string;
  defaultValue?: string | null;
  altName?: string;
  defaultAlt?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [alt, setAlt] = useState(defaultAlt ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<UploadedImage[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("الملف المختار ليس صورة");
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const img = await uploadImage(file, alt);
      setUrl(img.url);
    } catch (e) {
      setError((e as Error).message);
      setPreview(null);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function openLibrary() {
    setError(null);
    const res = await fetch("/api/media");
    const data = await res.json().catch(() => ({ items: [] }));
    setLibrary(data.items ?? []);
  }

  const shown = preview ?? (url || null);

  return (
    <div className="space-y-3">
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-md border border-dashed border-line bg-paper">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={alt || "معاينة"} className={`h-full w-full object-cover ${busy ? "opacity-50" : ""}`} />
        ) : (
          <span className="text-sm text-muted">لا توجد صورة</span>
        )}
        {busy && <span className="absolute rounded bg-white px-3 py-1 text-xs font-bold">جارٍ الرفع والضغط…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="btn-outline cursor-pointer px-3 py-1.5 text-xs">
          رفع صورة
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" data-testid={`upload-${name}`} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={openLibrary}>من المكتبة</button>
        {url && (
          <button type="button" className="btn-outline px-3 py-1.5 text-xs text-red-700" onClick={() => { setUrl(""); setPreview(null); }}>
            إزالة
          </button>
        )}
      </div>
      {altName && (
        <div>
          <label className="label text-xs" htmlFor={`${altName}-input`}>النص البديل (Alt Text)</label>
          <input id={`${altName}-input`} name={altName} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} className="input" placeholder="وصف مختصر للصورة لمحركات البحث وقارئات الشاشة" />
        </div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      {library && (
        <div className="rounded-md border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold">مكتبة الوسائط</span>
            <button type="button" className="text-xs text-muted hover:underline" onClick={() => setLibrary(null)}>إغلاق</button>
          </div>
          {library.length === 0 ? (
            <p className="text-xs text-muted">المكتبة فارغة.</p>
          ) : (
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {library.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="aspect-square overflow-hidden rounded border border-line hover:ring-2 hover:ring-gold-500"
                  onClick={() => { setUrl(m.url); setPreview(null); if (m.alt && !alt) setAlt(m.alt); setLibrary(null); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
