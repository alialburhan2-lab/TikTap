import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-display text-7xl font-extrabold text-gold-500">٤٠٤</p>
      <h1 className="text-2xl font-extrabold text-navy-900">الصفحة غير موجودة</h1>
      <Link href="/" className="btn-primary">العودة إلى الرئيسية</Link>
    </div>
  );
}
