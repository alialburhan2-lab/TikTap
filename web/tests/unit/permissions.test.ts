import { describe, expect, it } from "vitest";
import { allowedStatuses, can, canAssignRole, canDeleteArticle, canEditArticle } from "@/lib/permissions";

describe("permissions matrix", () => {
  it("OWNER has full access", () => {
    for (const p of ["user:manage", "settings:manage", "article:publish", "author:manage"] as const) expect(can("OWNER", p)).toBe(true);
  });
  it("EDITOR cannot manage users, settings or publish", () => {
    expect(can("EDITOR", "user:manage")).toBe(false);
    expect(can("EDITOR", "settings:manage")).toBe(false);
    expect(can("EDITOR", "article:publish")).toBe(false);
    expect(canAssignRole("EDITOR")).toBe(false);
    expect(can("EDITOR", "article:edit:any")).toBe(true);
  });
  it("AUTHOR only manages own drafts", () => {
    const me = { id: "a", role: "AUTHOR" as const };
    expect(canEditArticle(me, { authorId: "a", status: "DRAFT" })).toBe(true);
    expect(canEditArticle(me, { authorId: "a", status: "REVIEW" })).toBe(true);
    expect(canEditArticle(me, { authorId: "a", status: "PUBLISHED" })).toBe(false);
    expect(canEditArticle(me, { authorId: "b", status: "DRAFT" })).toBe(false);
    expect(canDeleteArticle(me, { authorId: "b", status: "DRAFT" })).toBe(false);
    expect(can("AUTHOR", "category:manage")).toBe(false);
  });
  it("allowed statuses per role", () => {
    expect(allowedStatuses("AUTHOR")).toEqual(["DRAFT", "REVIEW"]);
    expect(allowedStatuses("EDITOR")).toEqual(["DRAFT", "REVIEW"]);
    expect(allowedStatuses("OWNER")).toContain("PUBLISHED");
  });
  it("undefined role has no access", () => {
    expect(can(undefined, "dashboard:view")).toBe(false);
  });
});
