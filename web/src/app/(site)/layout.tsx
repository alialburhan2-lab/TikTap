import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-navy-900">
        انتقل إلى المحتوى
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
