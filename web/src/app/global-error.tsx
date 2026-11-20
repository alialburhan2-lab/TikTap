"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", textAlign: "center", padding: "4rem" }}>
        <h1>حدث خطأ غير متوقع</h1>
        <button onClick={reset}>إعادة المحاولة</button>
      </body>
    </html>
  );
}
