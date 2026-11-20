import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { deleteArticle, saveArticle, setArticleStatus } from "@/lib/services/articles";
import { getArchiveBuckets, listArticles, publicWhere } from "@/lib/articles";
import { makeUser, resetDb } from "./helpers";

const actor = (u: { id: string; role: "OWNER" | "EDITOR" | "AUTHOR" }) => ({ id: u.id, role: u.role });

describe("article service", () => {
  beforeEach(resetDb);

  it("owner creates and publishes; content sanitized; slug & tags generated", async () => {
    const owner = await makeUser("OWNER");
    const a = await saveArticle(actor(owner), {
      title: "مقال عن المشهد السياسي",
      content: `<p>نص المقال</p><script>alert(1)</script>`,
      tags: "سياسة، تحليل",
      status: "PUBLISHED",
    });
    expect(a.slug).toBe("مقال-عن-المشهد-السياسي");
    expect(a.content).not.toContain("script");
    expect(a.status).toBe("PUBLISHED");
    expect(a.publishedAt).not.toBeNull();
    expect(a.excerpt).toContain("نص المقال");
    expect(await prisma.articleTag.count({ where: { articleId: a.id } })).toBe(2);
  });

  it("generates unique slugs", async () => {
    const owner = await makeUser("OWNER");
    const a = await saveArticle(actor(owner), { title: "عنوان مكرر" });
    const b = await saveArticle(actor(owner), { title: "عنوان مكرر" });
    expect(a.slug).not.toBe(b.slug);
    expect(b.slug).toBe("عنوان-مكرر-2");
  });

  it("author can draft and submit for review but not publish", async () => {
    const author = await makeUser("AUTHOR");
    const a = await saveArticle(actor(author), { title: "مسودة الكاتب", status: "DRAFT" });
    await expect(saveArticle(actor(author), { title: "مسودة الكاتب", status: "PUBLISHED" }, a.id)).rejects.toBeInstanceOf(ForbiddenError);
    const r = await saveArticle(actor(author), { title: "مسودة الكاتب", status: "REVIEW" }, a.id);
    expect(r.status).toBe("REVIEW");
  });

  it("author cannot edit or delete others' articles", async () => {
    const owner = await makeUser("OWNER");
    const author = await makeUser("AUTHOR");
    const a = await saveArticle(actor(owner), { title: "مقال المالك" });
    await expect(saveArticle(actor(author), { title: "اختراق" }, a.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteArticle(actor(author), a.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("editor edits any draft but cannot publish or feature", async () => {
    const author = await makeUser("AUTHOR");
    const editor = await makeUser("EDITOR");
    const a = await saveArticle(actor(author), { title: "مقال للمراجعة", status: "REVIEW" });
    const edited = await saveArticle(actor(editor), { title: "مقال بعد التحرير", status: "REVIEW", featured: "on" }, a.id);
    expect(edited.title).toBe("مقال بعد التحرير");
    expect(edited.featured).toBe(false);
    await expect(setArticleStatus(actor(editor), a.id, "PUBLISHED")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("scheduled articles become public only when due", async () => {
    const owner = await makeUser("OWNER");
    const future = new Date(Date.now() + 3600_000).toISOString();
    const s = await saveArticle(actor(owner), { title: "مقال مجدول", status: "SCHEDULED", publishedAt: future });
    expect(s.status).toBe("SCHEDULED");
    expect(await prisma.article.count({ where: publicWhere({ id: s.id }) })).toBe(0);
    await prisma.article.update({ where: { id: s.id }, data: { publishedAt: new Date(Date.now() - 1000) } });
    expect(await prisma.article.count({ where: publicWhere({ id: s.id }) })).toBe(1);
  });

  it("publishing with a future date becomes scheduled; publish-now works", async () => {
    const owner = await makeUser("OWNER");
    const a = await saveArticle(actor(owner), { title: "نشر مستقبلي", status: "PUBLISHED", publishedAt: new Date(Date.now() + 86400_000).toISOString() });
    expect(a.status).toBe("SCHEDULED");
    const p = await setArticleStatus(actor(owner), a.id, "PUBLISHED");
    expect(p.status).toBe("PUBLISHED");
    expect(p.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("only one featured article", async () => {
    const owner = await makeUser("OWNER");
    const a = await saveArticle(actor(owner), { title: "مميز أول", status: "PUBLISHED", featured: "on" });
    await saveArticle(actor(owner), { title: "مميز ثان", status: "PUBLISHED", featured: "on" });
    expect((await prisma.article.findUnique({ where: { id: a.id } }))!.featured).toBe(false);
    expect(await prisma.article.count({ where: { featured: true } })).toBe(1);
  });

  it("validation errors are reported per field", async () => {
    const owner = await makeUser("OWNER");
    try {
      await saveArticle(actor(owner), { title: "ab" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields.title).toBeTruthy();
    }
  });

  it("search, category filter, date filter, archive buckets and pagination", async () => {
    const owner = await makeUser("OWNER");
    const cat = await prisma.category.create({ data: { name: "تحليلات", slug: "analysis" } });
    await saveArticle(actor(owner), { title: "الاقتصاد والطاقة", content: "<p>كلمة نادرة زمردية</p>", status: "PUBLISHED", categoryId: cat.id });
    await saveArticle(actor(owner), { title: "مقال آخر", content: "<p>عادي</p>", status: "PUBLISHED" });
    await saveArticle(actor(owner), { title: "مسودة زمردية", status: "DRAFT" });

    const byContent = await listArticles({ query: "زمردية" });
    expect(byContent.total).toBe(1); // المسودة لا تظهر
    expect((await listArticles({ query: "الطاقة" })).total).toBe(1);
    expect((await listArticles({ categorySlug: "analysis" })).total).toBe(1);
    expect((await listArticles({ from: new Date(Date.now() + 86400_000) })).total).toBe(0);
    const paged = await listArticles({ perPage: 1, page: 2 });
    expect(paged.totalPages).toBe(2);
    expect(paged.items).toHaveLength(1);
    const buckets = await getArchiveBuckets();
    expect(buckets[0].count).toBe(2);
  });

  it("owner can delete any article", async () => {
    const owner = await makeUser("OWNER");
    const author = await makeUser("AUTHOR");
    const a = await saveArticle(actor(author), { title: "سيُحذف" });
    await deleteArticle(actor(owner), a.id);
    expect(await prisma.article.count()).toBe(0);
  });
});
