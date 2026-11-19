import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "IRAQ TRAVEL — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-sand-50">{children}</body>
    </html>
  );
}
