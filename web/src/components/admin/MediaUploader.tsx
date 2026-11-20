"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadImage } from "./upload-client";

export function MediaUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="card space-y-3 p-5">
      <h2 className="font-extrabold text-navy-900">رفع صورة جديدة</h2>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        data-testid="media-file"
        className="block w-full text-sm file:ml-3 file:rounded file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-white"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          setMsg(null);
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="معاينة قبل الرفع" className="max-h-56 w-full rounded object-contain bg-paper" />
      )}
      <div>
        <label htmlFor="media-alt" className="label">النص البديل (Alt Text)</label>
        <input id="media-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} className="input" />
      </div>
      <p className="text-xs text-muted">تُضغط الصور تلقائياً وتُحوّل إلى WebP وتُزال بياناتها الوصفية.</p>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={!file || busy}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          try {
            await uploadImage(file, alt);
            setMsg({ ok: true, text: "تم رفع الصورة بنجاح" });
            setFile(null);
            setPreview(null);
            setAlt("");
            router.refresh();
          } catch (e) {
            setMsg({ ok: false, text: (e as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "جارٍ الرفع…" : "رفع"}
      </button>
    </div>
  );
}
