"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
      <h1 className="text-xl font-extrabold text-navy-900">تعذّر تحميل الصفحة</h1>
      <p className="text-sm text-muted">{error.digest ? `رمز الخطأ: ${error.digest}` : "حدث خطأ غير متوقع."}</p>
      <button onClick={reset} className="btn-primary">إعادة المحاولة</button>
    </div>
  );
}
