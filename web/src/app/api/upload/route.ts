import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-guard";
import { can } from "@/lib/permissions";
import { isSameOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";
import { maxUploadBytes, UploadError } from "@/lib/storage";
import { storeImage } from "@/lib/services/media";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  if (!can(user.role, "media:upload")) return NextResponse.json({ error: "لا تملك صلاحية رفع الملفات" }, { status: 403 });
  if (!(await rateLimit(`upload:${user.id}`, 60, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "تجاوزت الحد المسموح للرفع. حاول لاحقاً." }, { status: 429 });
  }
  const length = Number(req.headers.get("content-length") || 0);
  if (length > maxUploadBytes() + 64 * 1024) return NextResponse.json({ error: "حجم الملف يتجاوز الحد المسموح" }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  if (file.size > maxUploadBytes()) return NextResponse.json({ error: "حجم الملف يتجاوز الحد المسموح" }, { status: 413 });

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const media = await storeImage(buf, file.name, user.id, String(form.get("alt") || ""));
    return NextResponse.json({ id: media.id, url: media.url, width: media.width, height: media.height, alt: media.alt });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "تعذّر رفع الصورة" }, { status: 500 });
  }
}
