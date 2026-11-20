import { getCurrentUser } from "@/lib/auth-guard";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";

function csvCell(v: string): string {
  // منع حقن الصيغ في برامج الجداول
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "subscriber:manage")) return new Response("Unauthorized", { status: 401 });
  const subs = await prisma.newsletterSubscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
  const rows = ["email,subscribed_at", ...subs.map((s) => `${csvCell(s.email)},${csvCell(s.createdAt.toISOString())}`)];
  return new Response("﻿" + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
