"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CommentStatus } from "@prisma/client";
import { assertPermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { toActionError } from "@/lib/action-result";

function back(path: string, msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);
}

export async function moderateCommentAction(fd: FormData) {
  const status = String(fd.get("status") || "") as CommentStatus;
  const ret = String(fd.get("back") || "/admin/comments");
  let msg = "تم تحديث التعليق";
  try {
    await assertPermission("comment:moderate");
    if (!["PENDING", "APPROVED", "SPAM"].includes(status)) throw new Error("bad status");
    await prisma.comment.update({ where: { id: String(fd.get("id")) }, data: { status } });
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر التحديث";
  }
  back(ret.startsWith("/admin/comments") ? ret : "/admin/comments", msg);
}

export async function deleteCommentAction(fd: FormData) {
  let msg = "تم حذف التعليق";
  try {
    await assertPermission("comment:moderate");
    await prisma.comment.delete({ where: { id: String(fd.get("id")) } });
    revalidatePath("/", "layout");
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  back("/admin/comments", msg);
}

export async function toggleMessageReadAction(fd: FormData) {
  let msg = "تم التحديث";
  try {
    await assertPermission("message:manage");
    await prisma.contactMessage.update({ where: { id: String(fd.get("id")) }, data: { read: fd.get("read") === "1" } });
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر التحديث";
  }
  back("/admin/messages", msg);
}

export async function deleteMessageAction(fd: FormData) {
  let msg = "تم حذف الرسالة";
  try {
    await assertPermission("message:manage");
    await prisma.contactMessage.delete({ where: { id: String(fd.get("id")) } });
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  back("/admin/messages", msg);
}

export async function deleteSubscriberAction(fd: FormData) {
  let msg = "تم حذف المشترك";
  try {
    await assertPermission("subscriber:manage");
    await prisma.newsletterSubscriber.delete({ where: { id: String(fd.get("id")) } });
  } catch (err) {
    msg = toActionError(err).message ?? "تعذّر الحذف";
  }
  back("/admin/subscribers", msg);
}
