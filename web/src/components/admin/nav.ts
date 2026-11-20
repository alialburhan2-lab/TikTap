import type { Permission } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  permission: Permission;
  icon: string;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "لوحة التحكم", permission: "dashboard:view", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/admin/articles", label: "المقالات", permission: "article:create", icon: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" },
  { href: "/admin/articles/new", label: "مقال جديد", permission: "article:create", icon: "M12 5v14M5 12h14" },
  { href: "/admin/categories", label: "التصنيفات", permission: "category:manage", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/tags", label: "الوسوم", permission: "tag:manage", icon: "M3 12V4h8l9 9-8 8z" },
  { href: "/admin/media", label: "الوسائط", permission: "media:upload", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" },
  { href: "/admin/comments", label: "التعليقات", permission: "comment:moderate", icon: "M4 5h16v11H8l-4 4z" },
  { href: "/admin/messages", label: "الرسائل", permission: "message:manage", icon: "M3 6h18v12H3zM3 6l9 7 9-7" },
  { href: "/admin/subscribers", label: "المشتركون", permission: "subscriber:manage", icon: "M4 6h16v12H4zM8 10h8" },
  { href: "/admin/analytics", label: "الإحصائيات", permission: "analytics:view", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/admin/users", label: "المستخدمون والصلاحيات", permission: "user:manage", icon: "M16 11a4 4 0 1 0-8 0M4 21c0-4 4-6 8-6s8 2 8 6" },
  { href: "/admin/author", label: "بيانات الكاتب", permission: "author:manage", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6" },
  { href: "/admin/settings", label: "إعدادات الموقع", permission: "settings:manage", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-2V4h-4v2L9 8 7 7 5 11l2 1v0l-2 1 2 4 2-1 2 2v2h4v-2l2-2 2 1 2-4z" },
];
