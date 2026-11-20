import { beforeEach, describe, expect, it } from "vitest";
import sharp from "sharp";
import { existsSync } from "fs";
import path from "path";
import { isLoginBlocked, rateLimit, recordLoginAttempt } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { processImage, UploadError } from "@/lib/storage";
import { safeLocalPath } from "@/lib/storage/local";
import { storeImage, removeMedia } from "@/lib/services/media";
import { makeUser, resetDb } from "./helpers";

describe("rate limiting", () => {
  beforeEach(resetDb);
  it("blocks login after 5 failures for an email and clears on success", async () => {
    for (let i = 0; i < 4; i++) await recordLoginAttempt("x@test.local", "ip1", false);
    expect(await isLoginBlocked("x@test.local", "ip1")).toBe(false);
    await recordLoginAttempt("x@test.local", "ip1", false);
    expect(await isLoginBlocked("x@test.local", "ip2")).toBe(true);
    await recordLoginAttempt("x@test.local", "ip1", true);
    expect(await isLoginBlocked("x@test.local", "ip3")).toBe(false);
  });
  it("generic limiter", async () => {
    expect(await rateLimit("k", 2, 60000)).toBe(true);
    expect(await rateLimit("k", 2, 60000)).toBe(true);
    expect(await rateLimit("k", 2, 60000)).toBe(false);
  });
});

describe("CSRF origin check", () => {
  it("accepts same origin and rejects others", () => {
    expect(isSameOrigin(new Request("http://a.com/x", { method: "POST", headers: { origin: "http://a.com", host: "a.com" } }))).toBe(true);
    expect(isSameOrigin(new Request("http://a.com/x", { method: "POST", headers: { origin: "http://evil.com", host: "a.com" } }))).toBe(false);
    expect(isSameOrigin(new Request("http://a.com/x", { method: "POST", headers: { host: "a.com" } }))).toBe(false);
  });
});

describe("uploads", () => {
  beforeEach(resetDb);
  it("rejects non-images by content, not extension", async () => {
    await expect(processImage(Buffer.from("<?php echo 1; ?>"))).rejects.toBeInstanceOf(UploadError);
    await expect(processImage(Buffer.alloc(0))).rejects.toBeInstanceOf(UploadError);
  });
  it("compresses, resizes and converts to webp", async () => {
    const png = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "#172A38" } }).png().toBuffer();
    const out = await processImage(png);
    expect(out.mimeType).toBe("image/webp");
    expect(out.width).toBe(2000);
    expect(out.data.length).toBeLessThan(png.length);
  });
  it("stores, records and deletes media", async () => {
    const u = await makeUser("AUTHOR");
    const png = await sharp({ create: { width: 50, height: 50, channels: 3, background: "#D8B77A" } }).png().toBuffer();
    const m = await storeImage(png, "x.png", u.id, "نص بديل");
    expect(m.url).toMatch(/^\/uploads\/\d{4}\/\d{2}\/[a-f0-9]+\.webp$/);
    expect(m.alt).toBe("نص بديل");
    const file = safeLocalPath(m.storageKey)!;
    expect(existsSync(file)).toBe(true);
    await removeMedia(m.id);
    expect(existsSync(file)).toBe(false);
  });
  it("prevents path traversal", () => {
    expect(safeLocalPath("../../etc/passwd")).toBeNull();
    expect(safeLocalPath("2026/01/a.webp")).toBe(path.resolve("./test-results/uploads-unit/2026/01/a.webp"));
  });
});
