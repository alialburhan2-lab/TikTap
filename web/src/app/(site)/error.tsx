"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-navy-900">حدث خطأ غير متوقع</h1>
      <p className="text-muted">نعتذر عن ذلك. يرجى المحاولة مرة أخرى.</p>
      <button onClick={reset} className="btn-primary">إعادة المحاولة</button>
    </div>
  );
}
