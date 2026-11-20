import type { ArticleStatus, Role } from "@prisma/client";

/**
 * مصفوفة الصلاحيات المركزية. أي تعديل على الأدوار يتم هنا فقط.
 *
 * OWNER  : صلاحية كاملة.
 * EDITOR : إضافة وتعديل جميع المقالات وإرسالها للمراجعة، وإدارة التصنيفات والوسوم والوسائط والتعليقات.
 * AUTHOR : كتابة المقالات وإدارة مسوداته الخاصة فقط.
 */
export type Permission =
  | "dashboard:view"
  | "article:create"
  | "article:edit:any"
  | "article:edit:own"
  | "article:delete:any"
  | "article:delete:own"
  | "article:publish"
  | "category:manage"
  | "tag:manage"
  | "media:upload"
  | "media:manage"
  | "comment:moderate"
  | "user:manage"
  | "author:manage"
  | "settings:manage"
  | "analytics:view"
  | "subscriber:manage"
  | "message:manage";

const MATRIX: Record<Role, readonly Permission[]> = {
  OWNER: [
    "dashboard:view",
    "article:create",
    "article:edit:any",
    "article:edit:own",
    "article:delete:any",
    "article:delete:own",
    "article:publish",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "comment:moderate",
    "user:manage",
    "author:manage",
    "settings:manage",
    "analytics:view",
    "subscriber:manage",
    "message:manage",
  ],
  EDITOR: [
    "dashboard:view",
    "article:create",
    "article:edit:any",
    "article:edit:own",
    "article:delete:own",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "comment:moderate",
    "analytics:view",
  ],
  AUTHOR: ["dashboard:view", "article:create", "article:edit:own", "article:delete:own", "media:upload"],
};

export const ROLES: Role[] = ["OWNER", "EDITOR", "AUTHOR"];

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export interface ArticleRef {
  authorId: string;
  status: ArticleStatus;
}

export interface Actor {
  id: string;
  role: Role;
}

/** الحالات التي يمكن للمستخدم ضبطها على المقال */
export function allowedStatuses(role: Role): ArticleStatus[] {
  if (can(role, "article:publish")) return ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
  return ["DRAFT", "REVIEW"];
}

export function canEditArticle(actor: Actor, article: ArticleRef): boolean {
  if (can(actor.role, "article:edit:any")) {
    // المحرر لا يعدّل المقالات المنشورة/المجدولة/المؤرشفة إلا إذا كان يملك صلاحية النشر
    if (!can(actor.role, "article:publish") && !["DRAFT", "REVIEW"].includes(article.status)) return false;
    return true;
  }
  if (can(actor.role, "article:edit:own") && article.authorId === actor.id) {
    return article.status === "DRAFT" || article.status === "REVIEW";
  }
  return false;
}

export function canDeleteArticle(actor: Actor, article: ArticleRef): boolean {
  if (can(actor.role, "article:delete:any")) return true;
  return (
    can(actor.role, "article:delete:own") &&
    article.authorId === actor.id &&
    (article.status === "DRAFT" || article.status === "REVIEW")
  );
}

/** هل يحق للمستخدم تعيين دور معيّن لمستخدم آخر؟ (المالك فقط) */
export function canAssignRole(actorRole: Role): boolean {
  return can(actorRole, "user:manage");
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "المالك",
  EDITOR: "محرر",
  AUTHOR: "كاتب",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "مسودة",
  REVIEW: "قيد المراجعة",
  SCHEDULED: "مجدول",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};
