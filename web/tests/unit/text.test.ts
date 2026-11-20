import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";
import { htmlToText, readingMinutes, sanitizeArticleHtml } from "@/lib/sanitize";
import { articleSchema, contactSchema, passwordSchema } from "@/lib/validation";

describe("slugify", () => {
  it("keeps Arabic letters and strips diacritics/symbols", () => {
    expect(slugify("قراءةٌ في المشهدِ السياسي!")).toBe("قراءة-في-المشهد-السياسي");
    expect(slugify("Hello World 2026")).toBe("hello-world-2026");
    expect(isValidSlug("تحليل-المشهد")).toBe(true);
    expect(isValidSlug("bad slug")).toBe(false);
    expect(isValidSlug("../etc")).toBe(false);
  });
});

describe("sanitizeArticleHtml (XSS)", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeArticleHtml(`<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src="x" onerror="a()"><iframe src="//e"></iframe>`);
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|iframe/i);
    expect(out).toContain("<p>hi</p>");
  });
  it("keeps allowed formatting and hardens external links", () => {
    const out = sanitizeArticleHtml(`<h2>ع</h2><blockquote><p>q</p></blockquote><ul><li>a</li></ul><a href="https://x.com">x</a><img src="https://res.cloudinary.com/a.png" alt="b">`);
    expect(out).toContain("<h2>");
    expect(out).toContain("<blockquote>");
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('alt="b"');
  });
  it("htmlToText and reading time", () => {
    expect(htmlToText("<p>مرحبا <b>بكم</b></p>")).toBe("مرحبا بكم");
    expect(readingMinutes("كلمة ".repeat(1000))).toBe(5);
  });
});

describe("validation", () => {
  it("rejects scheduled article without future date", () => {
    const r = articleSchema.safeParse({ title: "عنوان صالح", status: "SCHEDULED", publishedAt: "2000-01-01T00:00:00Z" });
    expect(r.success).toBe(false);
  });
  it("parses tags with Arabic comma", () => {
    const r = articleSchema.parse({ title: "عنوان صالح", tags: "سياسة، اقتصاد, سياسة" });
    expect(r.tags).toEqual(["سياسة", "اقتصاد"]);
  });
  it("rejects unsafe cover URL", () => {
    expect(articleSchema.safeParse({ title: "عنوان صالح", coverImage: "javascript:alert(1)" }).success).toBe(false);
  });
  it("honeypot and password strength", () => {
    expect(contactSchema.safeParse({ name: "اسم", email: "a@b.co", subject: "موضوع", message: "رسالة طويلة بما يكفي", website: "spam" }).success).toBe(false);
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("longpassword").success).toBe(false);
    expect(passwordSchema.safeParse("longpassword1").success).toBe(true);
  });
});
