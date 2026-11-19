import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/**
 * 1. Redirects locale-less public URLs to the visitor's language (cookie → Accept-Language → English).
 * 2. Fast pre-check for /admin: no session cookie → login. (Full signature + role checks run server-side
 *    in the admin layout and in every server action; this is only a first gate.)
 */
const PUBLIC_FILE = /\.(?:[a-z0-9]+)$/i;

function preferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (isLocale(cookie)) return cookie;
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("ckb") || tag === "ku" || tag.startsWith("ku-")) return "ckb";
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login" && !req.cookies.get("it_session")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || PUBLIC_FILE.test(pathname)) return NextResponse.next();

  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml).*)"],
};

