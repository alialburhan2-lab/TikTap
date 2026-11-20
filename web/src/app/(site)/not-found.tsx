import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-gold-500">٤٠٤</p>
      <h1 className="text-2xl font-extrabold text-navy-900">الصفحة غير موجودة</h1>
      <p className="text-muted">ربما نُقل المحتوى أو أن الرابط غير صحيح.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">العودة إلى الرئيسية</Link>
        <Link href="/search" className="btn-outline">البحث في الموقع</Link>
      </div>
    </div>
  );
}
